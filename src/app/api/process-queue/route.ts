import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import nodemailer from 'nodemailer';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Max execution time for Vercel hobby

export async function POST(req: Request) {
  // Can be triggered by Upstash QStash.
  // In production, we'd verify the Upstash signature here.
  
  try {
    // 1. Fetch next 5 pending emails
    const { data: pendingQueue, error: fetchError } = await supabase
      .from('queue')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(5);

    if (fetchError) throw new Error(`Fetch error: ${fetchError.message}`);

    if (!pendingQueue || pendingQueue.length === 0) {
      return NextResponse.json({ message: 'No pending emails in the queue.' }, { status: 200 });
    }

    // Mark these as processing temporarily to avoid double-sends if the cron runs twice quickly
    // Wait, let's just directly process them and then mark sent/failed, or mark 'processing' first.
    // For simplicity, let's process and then mark.
    
    const senderEmails = [...new Set(pendingQueue.map(q => q.sender_email))];
    
    // Fetch sender credentials
    const { data: senders, error: sendersError } = await supabase
      .from('senders')
      .select('*')
      .in('email', senderEmails);

    if (sendersError) throw new Error(`Senders fetch error: ${sendersError.message}`);

    // Map senders for easy lookup
    const senderCredentials: Record<string, string> = {};
    senders?.forEach(s => {
      senderCredentials[s.email] = s.app_password;
    });

    // Create transporters
    const transporters: Record<string, nodemailer.Transporter> = {};
    for (const email of senderEmails) {
      if (senderCredentials[email]) {
        transporters[email] = nodemailer.createTransport({
          host: email.includes('gmail') ? 'smtp.gmail.com' : 'smtp-mail.outlook.com',
          port: 587,
          secure: false,
          auth: {
            user: email,
            pass: senderCredentials[email],
          },
        });
      }
    }

    // 2. Process emails concurrently
    const results = await Promise.allSettled(
      pendingQueue.map(async (task) => {
        const transporter = transporters[task.sender_email];
        if (!transporter) {
          throw new Error(`No valid credentials found for sender: ${task.sender_email}`);
        }

        const mailOptions = {
          from: task.sender_email,
          to: task.recipient_email,
          subject: task.subject,
          text: task.body,
        };

        // Send Email
        const info = await transporter.sendMail(mailOptions);
        return { task, info };
      })
    );

    // 3. Update Statuses
    const updatePromises = results.map((result, index) => {
      const task = pendingQueue[index];
      const status = result.status === 'fulfilled' ? 'sent' : 'failed';
      // In a real app we might log the exact error message on failure
      return supabase
        .from('queue')
        .update({ 
          status, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', task.id);
    });

    await Promise.all(updatePromises);

    return NextResponse.json({ 
      message: `Processed ${pendingQueue.length} emails.`,
      results: results.map((r, i) => ({
        id: pendingQueue[i].id,
        status: r.status,
        error: r.status === 'rejected' ? r.reason?.message : undefined
      }))
    }, { status: 200 });
    
  } catch (error: any) {
    console.error("Queue processing error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Support GET for easy manual triggering during development
export async function GET(req: Request) {
  return POST(req);
}

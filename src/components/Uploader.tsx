"use client";

import { useState } from 'react';
import { Upload, FileType, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import mammoth from 'mammoth';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';

export default function Uploader({ employeeId }: { employeeId?: string }) {
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [wordFile, setWordFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const defaultSubject = "Exciting Updates Just for You, {Name}!";
  const defaultBody = "Hi {Name},\n\nWe wanted to reach out and share some exciting news...";

  const handleProcess = async () => {
    if (!excelFile || !wordFile) {
      setError("Please upload both an Excel file and a Word document.");
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    setProgress('Parsing files...');

    try {
      // 1. Parse Excel
      const excelBuffer = await excelFile.arrayBuffer();
      const workbook = XLSX.read(excelBuffer);
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const clients: any[] = XLSX.utils.sheet_to_json(sheet);

      if (clients.length === 0) throw new Error("Excel sheet is empty.");

      // 2. Parse Word Document
      const wordBuffer = await wordFile.arrayBuffer();
      const wordResult = await mammoth.extractRawText({ arrayBuffer: wordBuffer });
      const rawText = wordResult.value;

      const templates = rawText.split('---').map(t => t.trim()).filter(t => t.length > 0);
      const templateToUse = templates.length > 0 ? templates[0] : defaultBody;
      
      const lines = templateToUse.split('\n');
      const subject = lines[0].startsWith('Subject:') ? lines[0].replace('Subject:', '').trim() : defaultSubject;
      const bodyTemplate = lines[0].startsWith('Subject:') ? lines.slice(1).join('\n').trim() : templateToUse;

      setProgress(`Preparing ${clients.length} emails...`);

      const queueItems = clients.map(client => {
        let name = 'Valued Client';
        let email = '';

        for (const [key, value] of Object.entries(client)) {
          if (typeof value !== 'string' && typeof value !== 'number') continue;
          const strVal = String(value);
          const lowerKey = key.toLowerCase();

          if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(strVal)) {
            email = strVal;
          }
          
          if (lowerKey.includes('name') || lowerKey.includes('first')) {
            name = strVal;
          }
        }

        if (!email) return null;

        const personalizedSubject = subject.replace(/\{Name\}/gi, name);
        const personalizedBody = bodyTemplate.replace(/\{Name\}/gi, name);

        return {
          employee_id: employeeId || null,
          recipient_email: email,
          sender_email: '', // Placeholder, will set below
          subject: personalizedSubject,
          body: personalizedBody,
          status: 'pending'
        };
      }).filter(Boolean);

      if (queueItems.length === 0) throw new Error("No valid emails found in the Excel sheet.");

      setProgress('Fetching sender credentials...');
      const { data: senders, error: senderError } = await supabase
        .from('senders')
        .select('email')
        .eq('user_id', employeeId)
        .limit(1);
      
      if (senderError || !senders || senders.length === 0) {
        throw new Error("No sender configured in the 'senders' table. Please add your credentials above.");
      }
      
      const senderEmail = senders[0].email;
      queueItems.forEach(item => {
        if (item) item.sender_email = senderEmail;
      });

      setProgress(`Saving ${queueItems.length} emails to queue...`);
      
      const chunkSize = 500;
      for (let i = 0; i < queueItems.length; i += chunkSize) {
        const chunk = queueItems.slice(i, i + chunkSize);
        const { error: insertError } = await supabase.from('queue').insert(chunk as any[]);
        if (insertError) throw new Error(`Error inserting to queue: ${insertError.message}`);
      }

      setSuccess(`Successfully added ${queueItems.length} emails to the queue!`);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
      setProgress('');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#111111] border border-gray-800 rounded-2xl p-8 shadow-2xl"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-700 rounded-xl hover:border-blue-500 transition-colors bg-black/20">
          <FileType className="w-10 h-10 text-green-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Excel Clients List</h3>
          <p className="text-sm text-gray-500 text-center mb-4">Upload .xlsx or .csv containing "Name" and "Email" columns.</p>
          <input 
            type="file" 
            accept=".xlsx,.csv" 
            onChange={(e) => setExcelFile(e.target.files?.[0] || null)}
            className="text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-900/30 file:text-blue-400 hover:file:bg-blue-900/50"
          />
        </div>

        <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-700 rounded-xl hover:border-purple-500 transition-colors bg-black/20">
          <FileType className="w-10 h-10 text-blue-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Word Templates</h3>
          <p className="text-sm text-gray-500 text-center mb-4">Upload .docx with templates containing {"{Name}"} placeholders.</p>
          <input 
            type="file" 
            accept=".docx" 
            onChange={(e) => setWordFile(e.target.files?.[0] || null)}
            className="text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-900/30 file:text-purple-400 hover:file:bg-purple-900/50"
          />
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-900/20 border border-red-500/50 rounded-lg flex items-center text-red-400">
          <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-900/20 border border-green-500/50 rounded-lg flex items-center text-green-400">
          <CheckCircle2 className="w-5 h-5 mr-3 flex-shrink-0" />
          <p>{success}</p>
        </div>
      )}

      <button
        onClick={handleProcess}
        disabled={loading || !excelFile || !wordFile}
        className="w-full py-4 rounded-xl font-bold text-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center shadow-lg shadow-purple-900/20"
      >
        {loading ? (
          <>
            <Loader2 className="w-6 h-6 animate-spin mr-3" />
            {progress}
          </>
        ) : (
          <>
            <Upload className="w-6 h-6 mr-3" />
            Process and Queue Emails
          </>
        )}
      </button>
    </motion.div>
  );
}

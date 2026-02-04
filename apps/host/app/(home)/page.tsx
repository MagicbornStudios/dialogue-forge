'use client';

import Link from 'next/link';
import { Code2, BookOpen, Film, Settings, Terminal, Users } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="text-center space-y-8 p-8">
        <h1 className="text-5xl font-bold text-white mb-4">
          Dialogue Forge
        </h1>
        <p className="text-xl text-slate-300 mb-12">
          Visual node-based dialogue editor with Yarn Spinner support
        </p>
        
        <div className="flex gap-6 justify-center">
          <Link
            href="/forge"
            className="group flex flex-col items-center gap-3 p-6 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 hover:border-slate-600 transition-all"
          >
            <Code2 className="w-12 h-12 text-blue-400 group-hover:text-blue-300" />
            <span className="text-lg font-semibold text-white">Forge</span>
            <span className="text-sm text-slate-400">Visual Dialogue Editor</span>
          </Link>

          <Link
            href="/video"
            className="group flex flex-col items-center gap-3 p-6 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 hover:border-slate-600 transition-all"
          >
            <Film className="w-12 h-12 text-rose-400 group-hover:text-rose-300" />
            <span className="text-lg font-semibold text-white">Video Studio</span>
            <span className="text-sm text-slate-400">Template Workspace</span>
          </Link>

          <Link
            href="/writer"
            className="group flex flex-col items-center gap-3 p-6 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 hover:border-slate-600 transition-all"
          >
            <BookOpen className="w-12 h-12 text-green-400 group-hover:text-green-300" />
            <span className="text-lg font-semibold text-white">Writer</span>
            <span className="text-sm text-slate-400">Narrative Editor</span>
          </Link>

          <Link
            href="/characters"
            className="group flex flex-col items-center gap-3 p-6 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 hover:border-slate-600 transition-all"
          >
            <Users className="w-12 h-12 text-amber-400 group-hover:text-amber-300" />
            <span className="text-lg font-semibold text-white">Characters</span>
            <span className="text-sm text-slate-400">Character Workspace</span>
          </Link>
          
          <Link
            href="/opencode"
            className="group flex flex-col items-center gap-3 p-6 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 hover:border-slate-600 transition-all"
          >
            <Terminal className="w-12 h-12 text-orange-400 group-hover:text-orange-300" />
            <span className="text-lg font-semibold text-white">OpenCode</span>
            <span className="text-sm text-slate-400">AI Assistant</span>
          </Link>
          
          <Link
            href="/admin"
            className="group flex flex-col items-center gap-3 p-6 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 hover:border-slate-600 transition-all"
          >
            <Settings className="w-12 h-12 text-purple-400 group-hover:text-purple-300" />
            <span className="text-lg font-semibold text-white">Admin</span>
            <span className="text-sm text-slate-400">Payload CMS</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

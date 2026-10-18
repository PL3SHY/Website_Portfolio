import { Building2, RotateCcw, ShieldCheck, User } from 'lucide-react';
import { enterAs, resetDemo } from '../../demo/enter';

// Replaces the login / sign-up pages in the demo: there are no real accounts, so visitors pick a
// sample role and go straight in.
export default function DemoEntry() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans text-slate-900">
      <header className="border-b border-gray-100 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center px-4 sm:px-6 lg:h-20 lg:px-8">
          <a href="#/" className="flex items-center gap-2">
            <div className="rounded-xl bg-blue-600 p-1.5 sm:p-2">
              <Building2 className="size-5 text-white sm:size-6" />
            </div>
            <span className="text-base font-bold text-slate-800 sm:text-xl">
              Commerciales<span className="text-blue-600">Flores</span>
            </span>
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-blue-700">
          Demo · sample data only
        </span>
        <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">Try Commerciales Flores</h1>
        <p className="mt-3 max-w-xl leading-relaxed text-slate-600">
          There are no accounts to create or sign in to here. Pick a role to explore the real screens with made-up data.
          Nothing is saved anywhere except in this browser tab.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <button
            onClick={() => enterAs('client')}
            className="group rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:border-blue-600 hover:shadow-md"
          >
            <div className="mb-4 inline-flex rounded-xl bg-blue-50 p-3 text-blue-600 group-hover:bg-blue-600 group-hover:text-white">
              <User className="size-6" />
            </div>
            <div className="text-lg font-bold">Explore as a client</div>
            <div className="text-sm font-medium text-blue-600">Evelynn Sanchez</div>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Browse spaces, make a reservation, submit a payment and message support.
            </p>
          </button>

          <button
            onClick={() => enterAs('admin')}
            className="group rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:border-blue-600 hover:shadow-md"
          >
            <div className="mb-4 inline-flex rounded-xl bg-slate-100 p-3 text-slate-700 group-hover:bg-blue-600 group-hover:text-white">
              <ShieldCheck className="size-6" />
            </div>
            <div className="text-lg font-bold">Explore as the admin</div>
            <div className="text-sm font-medium text-blue-600">Daisy Daryl Dyneroh</div>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Approve reservations and payments, manage units, parking, customers and website content.
            </p>
          </button>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-semibold">
          <a href="#/" className="text-slate-600 hover:text-blue-600">
            Back to home
          </a>
          <button onClick={resetDemo} className="inline-flex items-center gap-1.5 text-slate-600 hover:text-blue-600">
            <RotateCcw className="size-4" /> Reset demo data
          </button>
        </div>
      </main>
    </div>
  );
}

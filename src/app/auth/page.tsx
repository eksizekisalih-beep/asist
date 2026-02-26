import AuthForm from "@/components/auth/AuthForm";

export default function AuthPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0b] flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[25%] -left-[10%] w-[50%] h-[50%] bg-indigo-500/10 blur-[120px] rounded-full" />
        <div className="absolute -bottom-[25%] -right-[10%] w-[50%] h-[50%] bg-purple-500/10 blur-[120px] rounded-full" />
      </div>
      
      <div className="relative w-full max-w-xl">
        <div className="bg-white/80 dark:bg-[#0a0a0b]/80 backdrop-blur-2xl border border-white dark:border-white/5 shadow-2xl rounded-[2.5rem] overflow-hidden">
          <AuthForm />
        </div>
      </div>
    </div>
  );
}

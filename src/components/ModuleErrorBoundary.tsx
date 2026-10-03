import React from 'react';
import { AlertTriangle, RefreshCw, LayoutDashboard } from 'lucide-react';

type Props={moduleName:string;onError?:(message:string)=>void;onRetry?:()=>void;onHome?:()=>void;children:React.ReactNode};
type State={error:Error|null};

export default class ModuleErrorBoundary extends React.Component<Props,State>{
 state:State={error:null};
 static getDerivedStateFromError(error:Error){return {error};}
 componentDidCatch(error:Error,info:React.ErrorInfo){
  console.error('[SIFP module render error]',this.props.moduleName,error,info);
  this.props.onError?.(`${this.props.moduleName} gagal ditampilkan: ${error?.message||'Terjadi kesalahan tampilan.'}`);
 }
 componentDidUpdate(prev:Props){if(prev.moduleName!==this.props.moduleName&&this.state.error)this.setState({error:null});}
 render(){
  if(!this.state.error)return this.props.children;
  return <section className="min-h-[360px] flex items-center justify-center p-4">
   <div className="w-full max-w-xl rounded-3xl border border-rose-200 bg-white shadow-xl overflow-hidden">
    <div className="bg-gradient-to-r from-rose-50 to-amber-50 p-5 border-b border-rose-100">
     <div className="w-11 h-11 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center mb-3"><AlertTriangle className="w-6 h-6"/></div>
     <h2 className="text-lg font-black text-slate-900">Menu tidak dapat ditampilkan</h2>
     <p className="text-sm text-slate-600 mt-1">Modul <b>{this.props.moduleName}</b> mengalami kesalahan. Data Anda tidak diubah.</p>
    </div>
    <div className="p-5">
     <div className="rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-xs text-slate-600 break-words">{this.state.error.message||'Kesalahan tampilan tidak dikenal.'}</div>
     <div className="flex flex-col sm:flex-row gap-2 mt-4">
      <button onClick={()=>{this.setState({error:null});this.props.onRetry?.();}} className="inline-flex justify-center items-center gap-2 rounded-xl bg-teal-700 text-white px-4 py-2.5 text-xs font-bold"><RefreshCw className="w-4 h-4"/>Coba tampilkan lagi</button>
      <button onClick={this.props.onHome} className="inline-flex justify-center items-center gap-2 rounded-xl border border-slate-200 bg-white text-slate-700 px-4 py-2.5 text-xs font-bold"><LayoutDashboard className="w-4 h-4"/>Kembali ke Dashboard</button>
     </div>
    </div>
   </div>
  </section>;
 }
}
import React from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { installSmartNumericFormatting } from './utils/smartNumeric';

class RootErrorBoundary extends React.Component<{children:React.ReactNode},{error:Error|null}> {
  state={error:null as Error|null};
  static getDerivedStateFromError(error:Error){return {error};}
  componentDidCatch(error:Error,info:React.ErrorInfo){console.error('[SIFP ROOT ERROR]',error,info);}
  render(){
    if(this.state.error){
      return <div style={{minHeight:'100dvh',background:'#f4f7f6',padding:'24px',fontFamily:'system-ui',display:'flex',alignItems:'center',justifyContent:'center'}}>
        <div style={{width:'100%',maxWidth:420,background:'#fff',border:'1px solid #fecaca',borderRadius:20,padding:20,boxShadow:'0 16px 40px rgba(15,23,42,.12)'}}>
          <div style={{fontSize:12,fontWeight:800,color:'#b91c1c',marginBottom:8}}>SIFP • KESALAHAN APLIKASI</div>
          <h1 style={{fontSize:20,margin:'0 0 8px',color:'#0f172a'}}>Tampilan gagal dimuat</h1>
          <p style={{fontSize:13,lineHeight:1.6,color:'#475569'}}>Aplikasi menangkap kesalahan yang sebelumnya menyebabkan layar putih.</p>
          <pre style={{whiteSpace:'pre-wrap',wordBreak:'break-word',fontSize:11,background:'#fff1f2',padding:12,borderRadius:12,color:'#9f1239'}}>{this.state.error.message||String(this.state.error)}</pre>
          <button onClick={()=>window.location.reload()} style={{width:'100%',marginTop:12,border:0,borderRadius:12,padding:'12px 14px',background:'#0f766e',color:'#fff',fontWeight:800}}>Muat Ulang Aplikasi</button>
        </div>
      </div>
    }
    return this.props.children;
  }
}

installSmartNumericFormatting();

createRoot(document.getElementById('root')!).render(
  <RootErrorBoundary><App /></RootErrorBoundary>
);

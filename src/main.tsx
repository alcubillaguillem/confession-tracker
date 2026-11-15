import { render } from 'preact';
import { App } from './ui/App';
import './ui/estilos.css';

render(<App />, document.getElementById('app')!);

if (import.meta.env.PROD && 'serviceWorker' in navigator) void navigator.serviceWorker.register('./sw.js');

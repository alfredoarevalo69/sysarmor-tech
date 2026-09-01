// src/pages/api/check-port.ts
import type { APIRoute } from 'astro';
import { Socket } from 'net';

const checkTcpPort = (host: string, port: number, timeout = 3000): Promise<boolean> => {
  return new Promise((resolve) => {
    const socket = new Socket();
    let status = false;

    socket.setTimeout(timeout);

    socket.on('connect', () => {
      status = true;
      socket.destroy();
    });

    socket.on('timeout', () => {
      socket.destroy();
    });

    socket.on('error', () => {
      socket.destroy();
    });

    socket.on('close', () => {
      resolve(status);
    });

    socket.connect(port, host);
  });
};

export const GET: APIRoute = async ({ url }) => {
  const host = url.searchParams.get('host')?.trim();
  const portParam = url.searchParams.get('port');
  const port = portParam ? parseInt(portParam, 10) : NaN;

  if (!host || !port || isNaN(port) || port < 1 || port > 65535) {
    return new Response(JSON.stringify({ success: false, error: 'Parámetros host o puerto inválidos' }), { status: 400 });
  }

  try {
    const isOpen = await checkTcpPort(host, port);
    return new Response(JSON.stringify({ success: true, data: { host, port, isOpen } }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: 'Error interno al evaluar el socket' }), { status: 500 });
  }
};
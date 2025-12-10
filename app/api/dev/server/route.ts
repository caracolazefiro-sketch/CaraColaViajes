import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import os from 'os';

let serverProcess: any = null;
let isServerRunning = false;

/**
 * GET /api/dev/server-status - Check if dev server is running
 * POST /api/dev/start-server - Start the dev server
 */

export async function GET(request: NextRequest) {
  try {
    // Check if server is running by trying to connect
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    const response = await fetch('http://localhost:3000', {
      method: 'HEAD',
      signal: controller.signal,
    }).catch(() => null);

    clearTimeout(timeoutId);

    return NextResponse.json({
      running: response?.ok || isServerRunning,
      status: isServerRunning ? 'starting' : response?.ok ? 'ready' : 'stopped',
    });
  } catch (error) {
    return NextResponse.json(
      {
        running: isServerRunning,
        status: 'unknown',
        error: String(error),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check if already running
    if (isServerRunning || serverProcess) {
      return NextResponse.json(
        { error: 'Server is already running or starting' },
        { status: 400 }
      );
    }

    isServerRunning = true;

    // Determine the shell command based on OS
    const isWindows = os.platform() === 'win32';
    const command = isWindows ? 'npm.cmd' : 'npm';
    const args = ['run', 'dev'];

    // Spawn the dev server process
    serverProcess = spawn(command, args, {
      cwd: process.cwd(),
      stdio: 'inherit',
      shell: isWindows,
    });

    // Handle process exit
    serverProcess.on('exit', (code: number) => {
      isServerRunning = false;
      serverProcess = null;
      console.log(`Dev server exited with code ${code}`);
    });

    // Handle process error
    serverProcess.on('error', (error: Error) => {
      isServerRunning = false;
      serverProcess = null;
      console.error('Failed to start dev server:', error);
    });

    return NextResponse.json(
      {
        message: 'Dev server starting...',
        pid: serverProcess.pid,
        status: 'starting',
      },
      { status: 202 } // 202 Accepted
    );
  } catch (error) {
    isServerRunning = false;
    serverProcess = null;

    return NextResponse.json(
      {
        error: 'Failed to start server',
        details: String(error),
      },
      { status: 500 }
    );
  }
}

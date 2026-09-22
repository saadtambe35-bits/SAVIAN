import axios from 'axios';
import { BlockDemand, SolverResult } from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 8000,
});

export const checkBackendHealth = async (): Promise<boolean> => {
  try {
    const res = await api.get('/health');
    return res.data?.status === 'HEALTHY';
  } catch (err) {
    return false;
  }
};

export const fetchDemandsApi = async (): Promise<BlockDemand[] | null> => {
  try {
    const res = await api.get('/api/demands');
    return res.data;
  } catch (err) {
    return null;
  }
};

export const runSolverApi = async (
  demands: BlockDemand[],
  chaosMode: boolean
): Promise<SolverResult | null> => {
  try {
    const res = await api.post('/api/solver/solve', {
      demands,
      chaos_mode: chaosMode,
      max_solve_time_sec: 8.0,
    });
    return res.data;
  } catch (err) {
    return null;
  }
};

export const generateT409Api = async (demand: BlockDemand): Promise<any | null> => {
  try {
    const res = await api.post('/api/t409/generate', {
      demand_id: demand.id,
      demand_code: demand.demand_code,
      section_from: demand.section_from,
      section_to: demand.section_to,
      start_km: demand.start_km,
      end_km: demand.end_km,
      machinery_type: demand.machinery_type,
      requested_start_minutes: demand.requested_start_minutes,
      requested_end_minutes: demand.requested_end_minutes,
      required_minutes: demand.required_minutes,
      power_block_required: demand.power_block_required,
    });
    return res.data;
  } catch (err) {
    return null;
  }
};

export const transcribeAudioApi = async (wavBlob: Blob): Promise<string | null> => {
  try {
    const formData = new FormData();
    formData.append('file', wavBlob, 'recording.wav');
    const res = await api.post('/api/voice/transcribe', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 12000,
    });
    return res.data?.transcript || null;
  } catch (err) {
    return null;
  }
};

export default api;

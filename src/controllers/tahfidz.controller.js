import { sendSuccess } from '../utils/response.util.js';

// Fitur Tahfidz telah dinonaktifkan sesuai permintaan pengguna
export const getHalaqah = async (req, res) => sendSuccess(res, 'Fitur Tahfidz dinonaktifkan', { data: [] });
export const createHalaqah = async (req, res) => sendSuccess(res, 'Fitur Tahfidz dinonaktifkan');
export const updateHalaqah = async (req, res) => sendSuccess(res, 'Fitur Tahfidz dinonaktifkan');
export const deleteHalaqah = async (req, res) => sendSuccess(res, 'Fitur Tahfidz dinonaktifkan');

export const getSetoran = async (req, res) => sendSuccess(res, 'Fitur Tahfidz dinonaktifkan', { data: [] });
export const createSetoran = async (req, res) => sendSuccess(res, 'Fitur Tahfidz dinonaktifkan');
export const updateSetoran = async (req, res) => sendSuccess(res, 'Fitur Tahfidz dinonaktifkan');
export const deleteSetoran = async (req, res) => sendSuccess(res, 'Fitur Tahfidz dinonaktifkan');

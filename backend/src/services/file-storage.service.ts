import axios from 'axios';
import FormData from 'form-data';
import logger from '../config/logger';

const FILE_STORAGE_URL = process.env.FILE_STORAGE_URL || 'http://2407_file_storage:4000';

export interface FileUploadResponse {
	message: string;
	filename: string;
	originalname: string;
	filetype: string;
	file: string;
	folder: string;
	size?: number;
	mimetype?: string;
}

export class FileStorageService {
	static async uploadFile(file: Express.Multer.File, folder: string): Promise<FileUploadResponse> {
		const formData = new FormData();
		formData.append('file', file.buffer, {
			filename: file.originalname,
			contentType: file.mimetype,
		});

		try {
			const response = await axios.post<FileUploadResponse>(`${FILE_STORAGE_URL}/upload/${folder}`, formData, {
				headers: formData.getHeaders(),
				maxBodyLength: Infinity,
				maxContentLength: Infinity,
			});
			return response.data;
		} catch (error) {
			logger.error('File upload failed', { error });
			if (axios.isAxiosError(error)) {
				throw new Error(error.response?.data?.error || 'File upload failed');
			}
			throw error;
		}
	}

	static async getFile(folder: string, filename: string): Promise<{ data: Buffer; contentType: string }> {
		try {
			const response = await axios.get(`${FILE_STORAGE_URL}/files/${folder}/${filename}`, {
				responseType: 'arraybuffer',
				validateStatus: (status) => status === 200,
			});

			return {
				data: Buffer.from(response.data),
				contentType: response.headers['content-type'] || 'application/octet-stream',
			};
		} catch (error) {
			if (axios.isAxiosError(error) && error.response?.status === 404) {
				throw new Error('File not found');
			}
			logger.error('File retrieval failed', { error });
			throw new Error('File retrieval failed');
		}
	}

	static async deleteFile(folder: string, filename: string): Promise<void> {
		try {
			await axios.delete(`${FILE_STORAGE_URL}/files/${folder}/${filename}`);
		} catch (error) {
			if (axios.isAxiosError(error) && error.response?.status === 404) {
				throw new Error('File not found');
			}
			logger.error('File deletion failed', { error });
			throw new Error('File deletion failed');
		}
	}

	static async createFolder(folder: string): Promise<void> {
		try {
			await axios.post(`${FILE_STORAGE_URL}/create-folder/${folder}`);
		} catch (error) {
			logger.error('Folder creation failed', { error });
			throw new Error('Folder creation failed');
		}
	}
}

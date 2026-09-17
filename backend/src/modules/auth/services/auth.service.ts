import jwt, { SignOptions } from 'jsonwebtoken';
import User, { IUser } from '../../users/models/User';
import authConfig from '../../../config/auth';

interface RegisterData {
	email: string;
	password: string;
	firstName: string;
	lastName: string;
}

function toPublicUser(user: IUser) {
	return {
		_id: user.id,
		email: user.email,
		firstName: user.firstName,
		lastName: user.lastName,
		role: user.role,
		isActive: user.isActive,
		createdAt: user.createdAt,
		updatedAt: user.updatedAt,
	};
}

function generateToken(user: IUser): string {
	const options: SignOptions = { expiresIn: authConfig.jwtExpiresIn as SignOptions['expiresIn'] };
	return jwt.sign({ id: String(user._id) }, authConfig.jwtSecret, options);
}

export class AuthService {
	static async register(data: RegisterData) {
		const existing = await User.findOne({ email: data.email.toLowerCase().trim() });
		if (existing) {
			throw new Error('User already exists');
		}

		if (!data.password || data.password.length < 8) {
			throw new Error('Password must be at least 8 characters');
		}

		const user = await User.create({
			email: data.email,
			password: data.password,
			firstName: data.firstName,
			lastName: data.lastName,
			role: 'admin',
			isActive: true,
		});

		return {
			user: toPublicUser(user),
			token: generateToken(user),
		};
	}

	static async login(email: string, password: string) {
		const user = await User.findOne({ email: email.toLowerCase().trim() });
		if (!user || !(await user.comparePassword(password))) {
			throw new Error('Invalid credentials');
		}

		if (!user.isActive) {
			throw new Error('Account is deactivated');
		}

		return {
			user: toPublicUser(user),
			token: generateToken(user),
		};
	}

	static async getProfile(userId: string) {
		const user = await User.findById(userId).select('-password');
		if (!user) {
			throw new Error('User not found');
		}
		return { user: toPublicUser(user) };
	}
}

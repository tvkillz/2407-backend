import mongoose, { Document, HydratedDocument, Schema } from 'mongoose';
import bcrypt from 'bcrypt';
import authConfig from '../../../config/auth';

export interface IUser extends Document {
	email: string;
	password: string;
	firstName: string;
	lastName: string;
	role: 'admin';
	isActive: boolean;
	createdAt: Date;
	updatedAt: Date;
	comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
	{
		email: {
			type: String,
			required: [true, 'Email is required'],
			unique: true,
			lowercase: true,
			trim: true,
			match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address'],
		},
		password: {
			type: String,
			required: [true, 'Password is required'],
			minlength: [8, 'Password must be at least 8 characters'],
		},
		firstName: { type: String, required: true, trim: true, maxlength: 100 },
		lastName: { type: String, required: true, trim: true, maxlength: 100 },
		role: { type: String, enum: ['admin'], default: 'admin' },
		isActive: { type: Boolean, default: true },
	},
	{ timestamps: true }
);

UserSchema.pre('save', async function (this: HydratedDocument<IUser>, next) {
	if (!this.isModified('password')) {
		return next();
	}

	try {
		const salt = await bcrypt.genSalt(authConfig.saltRounds);
		this.password = await bcrypt.hash(this.password, salt);
		next();
	} catch (error) {
		next(error as Error);
	}
});

UserSchema.methods.comparePassword = async function (this: HydratedDocument<IUser>, candidatePassword: string): Promise<boolean> {
	return bcrypt.compare(candidatePassword, this.password);
};

UserSchema.set('toJSON', {
	transform: (_doc, ret) => {
		delete ret.password;
		return ret;
	},
});

const User = mongoose.model<IUser>('User', UserSchema);
export default User;

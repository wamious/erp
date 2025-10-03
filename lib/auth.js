import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabase } from './supabase';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';

const USER_TABLE_NAME = 'erp_reg_users';

export const authHelpers = {
    // Hash password
    async hashPassword(password) {
        return await bcrypt.hash(password, 12);
    },

    // Verify password
    async verifyPassword(password, hashedPassword) {
        return await bcrypt.compare(password, hashedPassword);
    },

    // Generate JWT token
    generateToken(user) {
        return jwt.sign(
            {
                id: user.id,
                email: user.email,
                role: user.role
            },
            JWT_SECRET,
            { expiresIn: '7d' }
        );
    },

    // Verify JWT token
    verifyToken(token) {
        try {
            return jwt.verify(token, JWT_SECRET);
        } catch (error) {
            return null;
        }
    },

    // Get user by email
    async getUserByEmail(email) {
        const { data, error } = await supabase
            .from(USER_TABLE_NAME)
            .select('*')
            .eq('email', email)
            .single();

        if (error) return null;
        return data;
    },

    // Get user by ID
    async getUserById(id) {
        const { data, error } = await supabase
            .from(USER_TABLE_NAME)
            .select('id, email, role, created_at, updated_at')
            .eq('id', id)
            .single();

        if (error) return null;
        return data;
    },

    // Create new user (admin only)
    async createUser(email, password, role = 'viewer') {
        const hashedPassword = await this.hashPassword(password);
        const { data, error } = await supabase
            .from(USER_TABLE_NAME)
            .insert([{
                email,
                password: hashedPassword,
                role
            }])
            .select('id, email, role, created_at')
            .single();

        if (error) throw error;
        return data;
    },

    // Get all users (admin only)
    async getAllUsers() {
        const { data, error } = await supabase
            .from(USER_TABLE_NAME)
            .select('id, email, role, created_at, updated_at')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    },

    // Update user role (admin only)
    async updateUserRole(userId, role) {
        const { data, error } = await supabase
            .from(USER_TABLE_NAME)
            .update({
                role,
                updated_at: new Date().toISOString()
            })
            .eq('id', userId)
            .select('id, email, role, updated_at')
            .single();

        if (error) throw error;
        return data;
    },

    // Delete user (admin only)
    async deleteUser(userId) {
        const { data, error } = await supabase
            .from(USER_TABLE_NAME)
            .delete()
            .eq('id', userId)
            .select('id, email')
            .single();

        if (error) throw error;
        return data;
    },

    // Authenticate user
    async authenticateUser(email, password) {
        const user = await this.getUserByEmail(email);
        if (!user) {
            return null;
        }

        const isValidPassword = await this.verifyPassword(password, user.password);
        if (!isValidPassword) {
            return null;
        }

        // Return user without password
        const { password: _, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }
};
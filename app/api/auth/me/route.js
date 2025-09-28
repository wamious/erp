import { NextResponse } from 'next/server';
import { authHelpers } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function GET() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;

        if (!token) {
            return NextResponse.json({ user: null });
        }

        const decoded = authHelpers.verifyToken(token);
        if (!decoded) {
            return NextResponse.json({ user: null });
        }

        const user = await authHelpers.getUserById(decoded.id);
        if (!user) {
            return NextResponse.json({ user: null });
        }

        return NextResponse.json({
            user: {
                id: user.id,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Get user error:', error);
        return NextResponse.json({ user: null });
    }
}
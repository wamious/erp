import { NextResponse } from 'next/server';
import { authHelpers } from '@/lib/auth';
import { cookies } from 'next/headers';

// Update user role (admin only)
export async function PUT(request, { params }) {
    try {
        const cookieStore = cookies();
        const token = cookieStore.get('token')?.value;

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const decoded = authHelpers.verifyToken(token);
        if (!decoded) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        const user = await authHelpers.getUserById(decoded.id);
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }

        const { role } = await request.json();
        const userId = params.id;

        if (!role || !['admin', 'viewer'].includes(role)) {
            return NextResponse.json(
                { error: 'Valid role is required (admin or viewer)' },
                { status: 400 }
            );
        }

        const updatedUser = await authHelpers.updateUserRole(userId, role);
        if (!updatedUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json(updatedUser);
    } catch (error) {
        console.error('Update user error:', error);
        return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    }
}

// Delete user (admin only)
export async function DELETE(request, { params }) {
    try {
        const cookieStore = cookies();
        const token = cookieStore.get('token')?.value;

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const decoded = authHelpers.verifyToken(token);
        if (!decoded) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        const user = await authHelpers.getUserById(decoded.id);
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }

        const userId = params.id;

        // Prevent admin from deleting themselves
        if (userId === user.id) {
            return NextResponse.json(
                { error: 'Cannot delete your own account' },
                { status: 400 }
            );
        }

        const deletedUser = await authHelpers.deleteUser(userId);
        if (!deletedUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Delete user error:', error);
        return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
    }
}
import { NextRequest, NextResponse } from 'next/server';
import { 
  createStudent,
  getAllStudents,
  getStudentsByParent,
  getStudentById
} from '@/lib/firebase/server-collections';
import { verifyIdToken } from '@/lib/firebase/auth';

/**
 * GET /api/students
 * Get students with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parentId = searchParams.get('parentId');
    
    let students;
    
    if (parentId) {
      // Get students for a specific parent
      students = await getStudentsByParent(parentId);
    } else {
      // Get all students
      students = await getAllStudents();
      console.log('Fetched all students:', students);
    }

    return NextResponse.json({
      success: true,
      students,
      total: students.length,
    });

  } catch (error) {
    console.error('Error fetching students:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/students
 * Create a new student
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, grade, parentId, idToken } = body;

    // Validate required fields
    if (!name || !grade || !parentId) {
      return NextResponse.json(
        { error: 'Missing required fields: name, grade, and parentId are required' },
        { status: 400 }
      );
    }

    // If idToken is provided, verify it (optional for staff operations)
    if (idToken) {
      const decodedToken = await verifyIdToken(idToken);
      if (!decodedToken) {
        return NextResponse.json(
          { error: 'Invalid token' },
          { status: 401 }
        );
      }
    }

    // Generate ID if not provided
    const studentId = id || `CH${Date.now().toString().slice(-6)}${Math.random().toString(36).substr(2, 3).toUpperCase()}`;

    // Check if student ID already exists
    const existingStudent = await getStudentById(studentId);
    if (existingStudent) {
      return NextResponse.json(
        { error: 'Student ID already exists' },
        { status: 409 }
      );
    }

    // Create the student
    const success = await createStudent({
      id: studentId,
      name: name.trim(),
      grade: grade.trim(),
      parentId: parentId.toLowerCase(),
    });

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to create student' },
        { status: 500 }
      );
    }

    // Return the created student
    const newStudent = await getStudentById(studentId);

    return NextResponse.json({
      success: true,
      message: 'Student created successfully',
      student: newStudent,
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating student:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

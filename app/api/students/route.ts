import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import admin from 'firebase-admin';

// TypeScript interfaces
interface StudentData {
  name: string;
  grade: string;
  parentId: string;
  createdAt?: admin.firestore.Timestamp;
  updatedAt?: admin.firestore.Timestamp;
  isActive?: boolean;
}

interface StudentDocument extends StudentData {
  id: string;
}

// GET method - Read all students from the 'students' collection
export async function GET(request: NextRequest) {
  try {
    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const grade = searchParams.get('grade');
    const parentId = searchParams.get('parentId');
    const isActive = searchParams.get('isActive');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query
    let query = adminDb.collection('students');

    // Apply filters
    if (grade) {
      query = query.where('grade', '==', grade);
    }

    if (parentId) {
      query = query.where('parentId', '==', parentId);
    }

    if (isActive !== null) {
      const activeValue = isActive === 'true';
      query = query.where('isActive', '==', activeValue);
    }

    // Apply pagination
    query = query.limit(limit).offset(offset);

    // Execute query
    const snapshot = await query.get();

    if (snapshot.empty) {
      return NextResponse.json({
        success: true,
        students: [],
        total: 0,
        message: 'No students found'
      });
    }

    // Transform documents to StudentDocument format
    const students: StudentDocument[] = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || '',
        grade: data.grade || '',
        parentId: data.parentId || '',
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        isActive: data.isActive !== false // Default to true if not specified
      };
    });

    // Get total count for pagination
    const totalSnapshot = await adminDb.collection('students').count().get();
    const total = totalSnapshot.data().count;

    return NextResponse.json({
      success: true,
      students,
      total,
      pagination: {
        limit,
        offset,
        hasMore: offset + limit < total
      }
    });

  } catch (error) {
    console.error('Error fetching students:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST method - Add a new student to the 'students' collection
export async function POST(request: NextRequest) {
  try {
    const { name, grade, parentId } = await request.json();

    // Validate required fields
    if (!name || !grade || !parentId) {
      return NextResponse.json(
        { error: 'Missing required fields: name, grade, and parentId are required' },
        { status: 400 }
      );
    }

    // Validate name (non-empty string)
    if (typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Name must be a non-empty string' },
        { status: 400 }
      );
    }

    // Validate grade (non-empty string)
    if (typeof grade !== 'string' || grade.trim().length === 0) {
      return NextResponse.json(
        { error: 'Grade must be a non-empty string' },
        { status: 400 }
      );
    }

    // Validate parentId (should be a valid wallet address or user ID)
    if (typeof parentId !== 'string' || parentId.trim().length === 0) {
      return NextResponse.json(
        { error: 'ParentId must be a non-empty string' },
        { status: 400 }
      );
    }

    // Check if parent exists in users collection
    const parentDoc = await adminDb.collection('users').doc(parentId.toLowerCase()).get();
    if (!parentDoc.exists) {
      return NextResponse.json(
        { error: 'Parent not found in users collection' },
        { status: 404 }
      );
    }

    // Check if parent has 'parent' role
    const parentData = parentDoc.data();
    if (parentData?.role !== 'parent') {
      return NextResponse.json(
        { error: 'ParentId must reference a user with parent role' },
        { status: 400 }
      );
    }

    // Prepare student data
    const studentData: StudentData = {
      name: name.trim(),
      grade: grade.trim(),
      parentId: parentId.toLowerCase(),
      isActive: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    // Create student document with auto-generated ID
    const studentRef = adminDb.collection('students').doc();
    await studentRef.set(studentData);

    // Fetch the created student to return complete data
    const createdStudent = await studentRef.get();
    const studentDoc = createdStudent.data();

    return NextResponse.json({
      success: true,
      message: 'Student created successfully',
      student: {
        id: studentRef.id,
        name: studentDoc?.name,
        grade: studentDoc?.grade,
        parentId: studentDoc?.parentId,
        isActive: studentDoc?.isActive,
        createdAt: studentDoc?.createdAt,
        updatedAt: studentDoc?.updatedAt
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating student:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

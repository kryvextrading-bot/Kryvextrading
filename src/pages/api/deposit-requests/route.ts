// API Route for Deposit Requests
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import DepositApiService from '@/services/deposit-api';

export async function POST(request: NextRequest) {
  try {

    // Parse FormData from the request
    const formData = await request.formData();
    
    // Extract data from FormData
    const amount = formData.get('amount') as string;
    const currency = formData.get('currency') as string;
    const network = formData.get('network') as string;
    const address = formData.get('address') as string;
    const proof = formData.get('proof') as File;
    const userId = formData.get('userId') as string;
    const userEmail = formData.get('userEmail') as string;
    const userName = formData.get('userName') as string;

    // Validate required fields
    if (!amount || !currency || !network || !userId || !userEmail) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate amount
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      );
    }

    // Create deposit request
    const depositRequest = await DepositApiService.createDepositRequest({
      amount,
      currency,
      network,
      address,
      proof,
      userId,
      userEmail,
      userName
    });


    return NextResponse.json({
      success: true,
      message: 'Deposit request submitted successfully',
      data: depositRequest
    });

  } catch (error) {
    console.error('💥 [API] Error creating deposit request:', error);
    return NextResponse.json(
      { 
        error: 'Failed to submit deposit request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {

    // Get user ID from query params (for user-specific requests)
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    let depositRequests;
    
    if (userId) {
      // Get deposit requests for specific user
      depositRequests = await DepositApiService.getUserDepositRequests(userId);
    } else {
      // Get all deposit requests (admin)
      depositRequests = await DepositApiService.getAllDepositRequests();
    }


    return NextResponse.json({
      success: true,
      data: depositRequests
    });

  } catch (error) {
    console.error('💥 [API] Error getting deposit requests:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get deposit requests',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

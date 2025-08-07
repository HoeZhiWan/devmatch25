'use client';

import React from 'react';
import AuthenticationWrapper from '@/components/AuthenticationWrapper';

export default function LoginPage() {
  return (
    <AuthenticationWrapper
      autoSignIn={true}
      redirectOnSuccess="/dashboard"
    />
  );
}
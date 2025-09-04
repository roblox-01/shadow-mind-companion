import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Crown } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function Success() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const { refreshSubscription } = useAuth();

  useEffect(() => {
    // Refresh subscription status after successful payment
    if (sessionId) {
      setTimeout(() => {
        refreshSubscription();
      }, 2000); // Give Stripe a moment to process
    }
  }, [sessionId, refreshSubscription]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background/95 to-muted/50 p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-green-600">
            Payment Successful!
          </CardTitle>
          <CardDescription>
            Welcome to ShadowAI Premium
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2 text-primary">
              <Crown className="h-5 w-5" />
              <span className="font-semibold">Premium Features Unlocked</span>
            </div>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>✓ Access to GPT-5 (Latest Model)</li>
              <li>✓ Up to 2000 tokens per response</li>
              <li>✓ Unlimited conversations</li>
              <li>✓ Priority support</li>
            </ul>
          </div>
          
          <div className="pt-4">
            <Button onClick={() => navigate('/')} className="w-full">
              Start Chatting with Premium AI
            </Button>
          </div>
          
          <p className="text-xs text-muted-foreground">
            Your subscription will be automatically renewed monthly. 
            You can manage your subscription anytime from your account settings.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
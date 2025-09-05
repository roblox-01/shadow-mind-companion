import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Crown, Zap, Plus, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const Index = () => {
  const { user, subscription } = useAuth();
  const navigate = useNavigate();
  const [recentChats, setRecentChats] = useState<any[]>([]);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    loadRecentChats();
  }, [user, navigate]);

  const loadRecentChats = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('id, title, updated_at')
        .order('updated_at', { ascending: false })
        .limit(3);

      if (error) throw error;
      setRecentChats(data || []);
    } catch (error) {
      console.error('Error loading recent chats:', error);
    }
  };

  const createNewChat = async () => {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .insert({
          user_id: user?.id,
          title: 'New Chat'
        })
        .select()
        .single();

      if (error) throw error;
      navigate(`/chat/${data.id}`);
    } catch (error) {
      console.error('Error creating chat:', error);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-muted/50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent flex items-center justify-center gap-2">
            <Sparkles className="h-8 w-8 text-primary" />
            Welcome to ShadowAI
          </h1>
          <p className="text-xl font-bold text-muted-foreground max-w-2xl mx-auto">
            Your intelligent AI companion for conversations, creativity, and problem-solving
          </p>
          <div className="flex items-center justify-center gap-2 mt-4">
            <Badge variant={subscription.subscribed ? "default" : "secondary"}>
              {subscription.subscribed ? `${subscription.subscription_tier} Plan` : "Free Plan"}
            </Badge>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {/* Start New Chat */}
          <Card className="cursor-pointer hover:shadow-lg transition-shadow border-dashed border-2 hover:border-primary/50" onClick={createNewChat}>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Plus className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Start New Chat</CardTitle>
              <CardDescription>
                Begin a fresh conversation with ShadowAI
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Recent Chats */}
          {recentChats.map((chat) => (
            <Card 
              key={chat.id} 
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => navigate(`/chat/${chat.id}`)}
            >
              <CardHeader>
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg truncate">{chat.title}</CardTitle>
                </div>
                <CardDescription>
                  Last updated: {new Date(chat.updated_at).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}

          {/* Upgrade Card (if not premium) */}
          {!subscription.subscribed && (
            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-primary" />
                  <CardTitle className="text-primary">Upgrade to Premium</CardTitle>
                </div>
                <CardDescription>
                  Unlock advanced AI models and unlimited conversations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => navigate('/pricing')} className="w-full">
                  View Plans
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Features Overview */}
        <div className="mt-16 max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">What can ShadowAI help you with?</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <MessageSquare className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold mb-2">Natural Conversations</h3>
              <p className="text-sm text-muted-foreground">
                Engage in natural, context-aware conversations on any topic
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <Zap className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-semibold mb-2">Creative Assistance</h3>
              <p className="text-sm text-muted-foreground">
                Get help with writing, brainstorming, and creative projects
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                <Crown className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-semibold mb-2">Premium Features</h3>
              <p className="text-sm text-muted-foreground">
                Access advanced AI models and enhanced capabilities
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;

import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

interface ChatInterfaceProps {
  conversationId: string;
}

const AI21_API_KEY = 'b1fb645b-e992-48e1-9dd6-554f8fd0bd99';

export function ChatInterface({ conversationId }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { session, subscription } = useAuth();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!conversationId) return;
    loadMessages();
  }, [conversationId]);

  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages((data || []) as Message[]);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast({
        title: "Error",
        description: "Failed to load conversation history",
        variant: "destructive",
      });
    }
  };

  const callAI21API = async (conversationMessages: Message[]): Promise<string> => {
    const systemMessage = {
      role: "system",
      content: "You are ShadowAI, a helpful AI assistant. You are knowledgeable, conversational, and provide detailed responses using markdown formatting when appropriate. Keep your responses engaging and well-structured."
    };

    const messages = [systemMessage];
    
    // Add recent conversation history (last 10 messages)
    const recentMessages = conversationMessages.slice(-10);
    recentMessages.forEach(msg => {
      messages.push({
        role: msg.role,
        content: msg.content
      });
    });

    const response = await fetch('https://api.ai21.com/studio/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer "b1fb645b-e992-48e1-9dd6-554f8fd0bd99"`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "jamba-1.6-large",
        messages: messages,
        max_tokens: 1000,
        temperature: 0.7,
        top_p: 0.9
      })
    });

    if (!response.ok) {
      throw new Error(`AI21 API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid AI response format');
    }

    return data.choices[0].message.content.trim();
  };

  const saveMessage = async (role: 'user' | 'assistant', content: string): Promise<string> => {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        role: role,
        content: content,
      })
      .select()
      .single();

    if (error) throw error;
    return data.id;
  };

  const updateConversationTitle = async (firstMessage: string) => {
    const title = firstMessage.length > 50 ? firstMessage.substring(0, 47) + '...' : firstMessage;
    
    await supabase
      .from('conversations')
      .update({ 
        title: title,
        updated_at: new Date().toISOString()
      })
      .eq('id', conversationId);
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !session) return;

    const userMessage = input.trim();
    setInput('');
    setIsLoading(true);

    try {
      // Save user message
      const userMessageId = await saveMessage('user', userMessage);
      
      // Add user message to UI immediately
      const newUserMessage: Message = {
        id: userMessageId,
        role: 'user',
        content: userMessage,
        created_at: new Date().toISOString()
      };
      
      const updatedMessages = [...messages, newUserMessage];
      setMessages(updatedMessages);

      // Update conversation title if it's the first message
      if (messages.length === 0) {
        await updateConversationTitle(userMessage);
      }

      // Get AI response
      const aiResponse = await callAI21API(updatedMessages);
      
      // Save AI response
      const aiMessageId = await saveMessage('assistant', aiResponse);
      
      // Add AI response to UI
      const newAiMessage: Message = {
        id: aiMessageId,
        role: 'assistant',
        content: aiResponse,
        created_at: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, newAiMessage]);

      toast({
        title: "Message sent",
        description: "Using jama-1.5-large model",
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b p-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">ShadowAI Chat</h2>
        <Badge variant={subscription?.subscribed ? "default" : "secondary"}>
          {subscription?.subscribed ? subscription.subscription_tier : "Free"}
        </Badge>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <h3 className="text-lg font-medium mb-2">Welcome to ShadowAI!</h3>
              <p>Start a conversation by typing a message below.</p>
              {!subscription?.subscribed && (
                <p className="text-sm mt-2">
                  Upgrade to Premium for advanced AI models and unlimited messages.
                </p>
              )}
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <Card className={`max-w-[80%] p-4 ${
                  message.role === 'user' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted'
                }`}>
                  <div 
                    className="whitespace-pre-wrap prose prose-sm max-w-none dark:prose-invert"
                    dangerouslySetInnerHTML={{ 
                      __html: message.role === 'assistant' 
                        ? message.content.replace(/\n/g, '<br>') 
                        : message.content 
                    }}
                  />
                </Card>
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex justify-start">
              <Card className="max-w-[80%] p-4 bg-muted">
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>ShadowAI is thinking...</span>
                </div>
              </Card>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <form onSubmit={sendMessage} className="border-t p-4">
        <div className="flex space-x-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" disabled={isLoading || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}

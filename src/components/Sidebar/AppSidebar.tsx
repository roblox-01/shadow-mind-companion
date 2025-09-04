import React, { useState, useEffect } from 'react';
import { MessageSquare, Plus, Crown, Settings, LogOut, Trash2 } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Conversation {
  id: string;
  title: string;
  created_at: string;
}

export function AppSidebar() {
  const { state } = useSidebar();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const { user, signOut, subscription } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user]);

  const loadConversations = async () => {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('id, title, created_at')
        .order('updated_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setConversations(data || []);
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  const createNewConversation = async () => {
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
      toast({
        title: "New conversation created",
        description: "Start chatting with ShadowAI!"
      });
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast({
        title: "Error",
        description: "Failed to create new conversation",
        variant: "destructive",
      });
    }
  };

  const deleteConversation = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setConversations(prev => prev.filter(c => c.id !== id));
      toast({
        title: "Conversation deleted",
        description: "The conversation has been removed"
      });
    } catch (error) {
      console.error('Error deleting conversation:', error);
      toast({
        title: "Error",
        description: "Failed to delete conversation",
        variant: "destructive",
      });
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  if (!user) return null;

  return (
<Sidebar collapsible="icon">      <SidebarContent>
        {/* Header */}
<div className="p-4 border-b">
  <div className="flex items-center gap-2">
    <SidebarTrigger className="shrink-0" />
    {state !== 'collapsed' && (
      <h2 className="text-lg font-semibold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
        ShadowAI
      </h2>
    )}
  </div>
</div>
        {/* New Chat Button */}
        <div className="p-4">
          <Button
            onClick={createNewConversation}
            className="w-full"
            size={state === 'collapsed' ? "icon" : "default"}
          >
            <Plus className="h-4 w-4" />
            {state !== 'collapsed' && <span className="ml-2">New Chat</span>}
          </Button>
        </div>

        {/* Conversations */}
        <SidebarGroup>
          <SidebarGroupLabel>Recent Chats</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {conversations.map((conversation) => (
                <SidebarMenuItem key={conversation.id}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={`/chat/${conversation.id}`}
                      className={({ isActive }) =>
                        `flex items-center justify-between group ${
                          isActive ? 'bg-muted text-primary font-medium' : 'hover:bg-muted/50'
                        }`
                      }
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <MessageSquare className="h-4 w-4 shrink-0" />
                        {state !== 'collapsed' && (
                          <span className="truncate text-sm">
                            {conversation.title}
                          </span>
                        )}
                      </div>
                      {state !== 'collapsed' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100"
                          onClick={(e) => deleteConversation(conversation.id, e)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Navigation */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink
                    to="/pricing"
                    className={({ isActive }) =>
                      isActive ? 'bg-muted text-primary font-medium' : 'hover:bg-muted/50'
                    }
                  >
                    <Crown className="h-4 w-4" />
                    {state !== 'collapsed' && <span>Upgrade</span>}
                    {state !== 'collapsed' && subscription.subscribed && (
                      <span className="ml-auto text-xs text-primary">PRO</span>
                    )}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* User Actions */}
        <div className="mt-auto p-4 border-t">
          <div className="space-y-2">
            {state !== 'collapsed' && (
              <div className="text-xs text-muted-foreground truncate">
                {user.email}
              </div>
            )}
            <Button
              variant="ghost"
              size={state === 'collapsed' ? "icon" : "sm"}
              onClick={handleSignOut}
              className="w-full justify-start"
            >
              <LogOut className="h-4 w-4" />
              {state !== 'collapsed' && <span className="ml-2">Sign Out</span>}
            </Button>
          </div>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}

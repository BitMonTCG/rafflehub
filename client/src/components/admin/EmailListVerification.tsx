import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle2, Copy, Download, MailCheck, Send, X, AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

// Mock email lists for demonstration
const MOCK_EMAIL_LISTS = [
  {
    id: 1,
    name: 'Active Subscribers',
    description: 'Users who have subscribed to our newsletter',
    subscriberCount: 1254,
    lastSent: '2025-05-10T15:30:00Z',
    openRate: 68.5,
    clickRate: 12.4,
    bounceRate: 2.1,
    status: 'active'
  },
  {
    id: 2,
    name: 'Raffle Winners',
    description: 'Users who have won raffles in the past',
    subscriberCount: 87,
    lastSent: '2025-05-05T09:45:00Z',
    openRate: 92.1,
    clickRate: 45.7,
    bounceRate: 0.8,
    status: 'active'
  },
  {
    id: 3,
    name: 'Inactive Users',
    description: 'Users who haven\'t participated in 3+ months',
    subscriberCount: 432,
    lastSent: '2025-04-20T11:15:00Z',
    openRate: 35.2,
    clickRate: 5.9,
    bounceRate: 4.3,
    status: 'inactive'
  },
  {
    id: 4,
    name: 'High-Value Customers',
    description: 'Users who have spent over $100',
    subscriberCount: 192,
    lastSent: '2025-05-12T08:30:00Z',
    openRate: 75.3,
    clickRate: 28.1,
    bounceRate: 1.2,
    status: 'active'
  },
  {
    id: 5,
    name: 'New Members',
    description: 'Users who joined in the last 30 days',
    subscriberCount: 89,
    lastSent: null,
    openRate: 0,
    clickRate: 0,
    bounceRate: 0,
    status: 'pending'
  }
];

type EmailList = typeof MOCK_EMAIL_LISTS[0];

const EmailListVerification: React.FC = () => {
  const [emailLists, setEmailLists] = useState<EmailList[]>([]);
  const [loading, setLoading] = useState(true);
  const [testEmailAddress, setTestEmailAddress] = useState('');
  const [isTestEmailDialogOpen, setIsTestEmailDialogOpen] = useState(false);
  const [selectedListId, setSelectedListId] = useState<number | null>(null);
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();
  
  useEffect(() => {
    // In a real implementation, this would be an API call
    const fetchEmailLists = async () => {
      setLoading(true);
      try {
        // Mock API response
        setTimeout(() => {
          setEmailLists(MOCK_EMAIL_LISTS);
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Error fetching email lists:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch email lists. Please try again.',
          variant: 'destructive',
        });
        setLoading(false);
      }
    };
    
    fetchEmailLists();
  }, [toast]);
  
  const handleSendTestEmail = async () => {
    if (!testEmailAddress || !selectedListId) return;
    
    setIsSending(true);
    
    // In a real implementation, this would be an API call
    try {
      // Simulating API call
      setTimeout(() => {
        toast({
          title: 'Test Email Sent',
          description: `A test email has been sent to ${testEmailAddress}`,
        });
        setIsSending(false);
        setIsTestEmailDialogOpen(false);
        setTestEmailAddress('');
      }, 1500);
    } catch (error) {
      console.error('Error sending test email:', error);
      toast({
        title: 'Error',
        description: 'Failed to send test email. Please try again.',
        variant: 'destructive',
      });
      setIsSending(false);
    }
  };
  
  const handleOpenTestDialog = (listId: number) => {
    setSelectedListId(listId);
    setIsTestEmailDialogOpen(true);
  };
  
  const handleVerifyList = (listId: number) => {
    // In a real implementation, this would be an API call
    toast({
      title: 'Verification Started',
      description: 'The email list is being verified. This may take a few minutes.',
    });
    
    // Mock verification process
    setTimeout(() => {
      setEmailLists(emailLists.map(list => 
        list.id === listId ? {...list, status: 'active'} : list
      ));
      
      toast({
        title: 'Verification Complete',
        description: 'The email list has been verified successfully.',
      });
    }, 2000);
  };
  
  const getTotalSubscribers = () => {
    return emailLists.reduce((total, list) => total + list.subscriberCount, 0);
  };
  
  const getAverageOpenRate = () => {
    const activeListsWithSends = emailLists.filter(list => list.status === 'active' && list.lastSent);
    if (activeListsWithSends.length === 0) return 0;
    
    const totalOpenRate = activeListsWithSends.reduce((total, list) => total + list.openRate, 0);
    return (totalOpenRate / activeListsWithSends.length).toFixed(1);
  };
  
  const exportEmailList = (listId: number) => {
    // In a real implementation, this would generate a CSV file
    toast({
      title: 'Export Started',
      description: 'Email list is being exported. Check your downloads folder shortly.'
    });
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Email List Verification</CardTitle>
            <CardDescription>
              Manage and verify your email subscriber lists
            </CardDescription>
          </div>
          <Button>
            <Send className="h-4 w-4 mr-2" />
            Create Campaign
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold">{emailLists.length}</div>
                <p className="text-sm text-muted-foreground">Email Lists</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold">{getTotalSubscribers().toLocaleString()}</div>
                <p className="text-sm text-muted-foreground">Total Subscribers</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold">{getAverageOpenRate()}%</div>
                <p className="text-sm text-muted-foreground">Avg. Open Rate</p>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {loading ? (
          <div className="py-8 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>List Name</TableHead>
                  <TableHead>Subscribers</TableHead>
                  <TableHead>Last Sent</TableHead>
                  <TableHead>Performance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {emailLists.map((list) => (
                  <TableRow key={list.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{list.name}</div>
                        <div className="text-sm text-muted-foreground">{list.description}</div>
                      </div>
                    </TableCell>
                    <TableCell>{list.subscriberCount.toLocaleString()}</TableCell>
                    <TableCell>
                      {list.lastSent ? new Date(list.lastSent).toLocaleDateString() : 'Never'}
                    </TableCell>
                    <TableCell>
                      {list.lastSent ? (
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            <span className="text-xs">Open: {list.openRate}%</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                            <span className="text-xs">Click: {list.clickRate}%</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 rounded-full bg-red-500"></div>
                            <span className="text-xs">Bounce: {list.bounceRate}%</span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">No data</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {list.status === 'active' ? (
                        <Badge className="bg-green-100 text-green-800">Active</Badge>
                      ) : list.status === 'inactive' ? (
                        <Badge variant="secondary">Inactive</Badge>
                      ) : (
                        <Badge variant="outline">Pending</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-1">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleOpenTestDialog(list.id)}
                        >
                          <MailCheck className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleVerifyList(list.id)}
                          disabled={list.status === 'active'}
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => exportEmailList(list.id)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
      <CardFooter className="border-t pt-6">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <span className="text-sm text-muted-foreground">
            Regularly verify your email lists to maintain good deliverability and prevent bounces.
          </span>
        </div>
      </CardFooter>
      
      {/* Test Email Dialog */}
      <Dialog open={isTestEmailDialogOpen} onOpenChange={setIsTestEmailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Test Email</DialogTitle>
            <DialogDescription>
              Send a test email to verify the functionality of this email list.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter recipient email"
                value={testEmailAddress}
                onChange={(e) => setTestEmailAddress(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Email Preview</Label>
              <Card className="p-4">
                <div className="text-sm">
                  <p className="font-medium mb-2">Subject: Test Email from BitMonTCG</p>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p>Hello,</p>
                    <p className="my-2">This is a test email to verify the functionality of our email system.</p>
                    <p>Thank you,<br />BitMonTCG Team</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTestEmailDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSendTestEmail}
              disabled={!testEmailAddress || isSending}
            >
              {isSending ? 'Sending...' : 'Send Test'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default EmailListVerification;

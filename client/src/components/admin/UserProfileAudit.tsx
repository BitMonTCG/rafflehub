import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle, CheckCircle, Download, Mail, RefreshCw, UserCheck } from 'lucide-react';
import axios from 'axios';

// Mock API response for demonstration
const MOCK_USER_PROFILES = [
  { 
    id: 1, 
    username: 'pokemon_fan1', 
    email: 'pokemon_fan1@example.com', 
    completeness: 90,
    missingFields: ['phoneNumber'],
    lastLogin: '2025-05-14T10:30:00Z',
    ticketsPurchased: 25
  },
  { 
    id: 2, 
    username: 'card_collector', 
    email: 'collector@example.com', 
    completeness: 70,
    missingFields: ['name', 'address'],
    lastLogin: '2025-05-10T15:45:00Z',
    ticketsPurchased: 12
  },
  { 
    id: 3, 
    username: 'raffle_winner', 
    email: 'winner@example.com', 
    completeness: 100,
    missingFields: [],
    lastLogin: '2025-05-15T08:12:00Z',
    ticketsPurchased: 50
  },
  { 
    id: 4, 
    username: 'newbie_collector', 
    email: 'newbie@example.com', 
    completeness: 40,
    missingFields: ['name', 'address', 'phoneNumber', 'birthdate'],
    lastLogin: '2025-05-01T09:22:00Z',
    ticketsPurchased: 2
  },
  { 
    id: 5, 
    username: 'charizard_hunter', 
    email: '', // Missing email
    completeness: 60,
    missingFields: ['email', 'phoneNumber'],
    lastLogin: '2025-05-12T14:30:00Z',
    ticketsPurchased: 18
  }
];

type UserProfile = typeof MOCK_USER_PROFILES[0];

const UserProfileAudit: React.FC = () => {
  const [userProfiles, setUserProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [completenessFilter, setCompletenessFilter] = useState<'all' | 'incomplete' | 'complete'>('all');
  const { toast } = useToast();
  
  useEffect(() => {
    // In a real implementation, this would be an API call
    const fetchUserProfiles = async () => {
      setLoading(true);
      try {
        // const response = await axios.get('/api/admin/users/profiles');
        // setUserProfiles(response.data);
        
        // Mock API response
        setTimeout(() => {
          setUserProfiles(MOCK_USER_PROFILES);
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Error fetching user profiles:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch user profiles. Please try again.',
          variant: 'destructive',
        });
        setLoading(false);
      }
    };
    
    fetchUserProfiles();
  }, [toast]);
  
  const filteredProfiles = userProfiles.filter(profile => {
    if (completenessFilter === 'all') return true;
    if (completenessFilter === 'incomplete') return profile.completeness < 100;
    if (completenessFilter === 'complete') return profile.completeness === 100;
    return true;
  });
  
  const sendProfileCompletionReminder = (userId: number, email: string) => {
    // In a real implementation, this would be an API call
    toast({
      title: 'Reminder Sent',
      description: `Profile completion reminder sent to ${email}`,
    });
  };
  
  const averageCompleteness = userProfiles.length > 0 
    ? Math.round(userProfiles.reduce((acc, profile) => acc + profile.completeness, 0) / userProfiles.length)
    : 0;
    
  const usersWithMissingEmail = userProfiles.filter(profile => !profile.email).length;
  
  const handleRefresh = () => {
    setLoading(true);
    // Mock refresh
    setTimeout(() => {
      setUserProfiles([...MOCK_USER_PROFILES]);
      setLoading(false);
      toast({
        title: 'Data Refreshed',
        description: 'User profile data has been updated.'
      });
    }, 1000);
  };
  
  const exportUserData = () => {
    // In a real implementation, this would generate a CSV/Excel file
    toast({
      title: 'Export Started',
      description: 'User data is being exported. Check your downloads folder shortly.'
    });
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>User Profile Audit</CardTitle>
            <CardDescription>
              Analyze user profile completeness and manage customer information
            </CardDescription>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={loading}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button
              variant="outline" 
              size="sm"
              onClick={exportUserData}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold">{userProfiles.length}</div>
                <p className="text-sm text-muted-foreground">Total Users</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold">{averageCompleteness}%</div>
                <p className="text-sm text-muted-foreground">Avg. Profile Completeness</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold">{usersWithMissingEmail}</div>
                <p className="text-sm text-muted-foreground">Users Missing Email</p>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Tabs defaultValue="all" onValueChange={(value) => setCompletenessFilter(value as any)}>
          <div className="flex justify-between items-center mb-4">
            <TabsList>
              <TabsTrigger value="all">All Profiles</TabsTrigger>
              <TabsTrigger value="incomplete">Incomplete</TabsTrigger>
              <TabsTrigger value="complete">Complete</TabsTrigger>
            </TabsList>
            <div className="text-sm text-muted-foreground">
              Showing {filteredProfiles.length} of {userProfiles.length} profiles
            </div>
          </div>
          
          <TabsContent value="all" className="m-0">
            {renderUserTable(filteredProfiles, loading, sendProfileCompletionReminder)}
          </TabsContent>
          <TabsContent value="incomplete" className="m-0">
            {renderUserTable(filteredProfiles, loading, sendProfileCompletionReminder)}
          </TabsContent>
          <TabsContent value="complete" className="m-0">
            {renderUserTable(filteredProfiles, loading, sendProfileCompletionReminder)}
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between border-t pt-6">
        <div className="text-sm text-muted-foreground">
          Last updated: {new Date().toLocaleString()}
        </div>
        <Button onClick={() => window.location.reload()}>
          Run Full Audit
        </Button>
      </CardFooter>
    </Card>
  );
};

function renderUserTable(profiles: UserProfile[], loading: boolean, sendReminder: (id: number, email: string) => void) {
  if (loading) {
    return (
      <div className="py-8 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (profiles.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-muted-foreground">No profiles match the current filter.</p>
      </div>
    );
  }

  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Username</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Completeness</TableHead>
            <TableHead>Missing Fields</TableHead>
            <TableHead>Last Login</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {profiles.map((profile) => (
            <TableRow key={profile.id}>
              <TableCell className="font-medium">{profile.username}</TableCell>
              <TableCell>
                {profile.email ? (
                  profile.email
                ) : (
                  <Badge variant="destructive">Missing</Badge>
                )}
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-2">
                  <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                    <div 
                      className={`h-2.5 rounded-full ${
                        profile.completeness >= 80 ? 'bg-green-600' :
                        profile.completeness >= 50 ? 'bg-yellow-400' : 'bg-red-500'
                      }`} 
                      style={{ width: `${profile.completeness}%` }}
                    ></div>
                  </div>
                  <span className="text-xs whitespace-nowrap">{profile.completeness}%</span>
                </div>
              </TableCell>
              <TableCell>
                {profile.missingFields.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {profile.missingFields.map((field) => (
                      <Badge key={field} variant="outline" className="text-xs">{field}</Badge>
                    ))}
                  </div>
                ) : (
                  <Badge variant="default" className="bg-green-100 text-green-800">Complete</Badge>
                )}
              </TableCell>
              <TableCell>
                {new Date(profile.lastLogin).toLocaleDateString()}
              </TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => sendReminder(profile.id, profile.email)}
                    disabled={!profile.email || profile.completeness === 100}
                  >
                    <Mail className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <UserCheck className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default UserProfileAudit;

import React, { useState } from 'react';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useRaffles, useEndRaffle, useDeleteRaffle } from '@/hooks/useRaffles';
import { useWinners } from '@/hooks/useWinners';
import { formatPrice, getTimeRemaining, getRelativeTimeString } from '@/utils/format';
import { Raffle } from '@/types';
import RaffleForm from './RaffleForm';
import { useToast } from '@/hooks/use-toast';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Trash2, Loader2, Edit, StopCircle } from 'lucide-react';
import CountdownTimer from '@/components/ui/CountdownTimer';

const AdminPanel: React.FC = () => {
  const { data: activeRaffles } = useRaffles(true);
  const { data: allRaffles } = useRaffles(false);
  const { data: winners } = useWinners();
  const [selectedRaffle, setSelectedRaffle] = useState<Raffle | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const endRaffleMutation = useEndRaffle();
  const deleteRaffleMutation = useDeleteRaffle();
  const { toast } = useToast();

  const handleEndRaffle = async (raffleId: number) => {
    if (window.confirm('Are you sure you want to end this raffle early? This will select a winner immediately.')) {
      try {
        await endRaffleMutation.mutateAsync(raffleId);
        toast({
          title: 'Raffle Ended',
          description: 'The raffle has been ended and a winner has been selected.',
        });
      } catch (error) {
        console.error('Error ending raffle:', error);
        toast({
          title: 'Error',
          description: 'Failed to end the raffle. Please try again.',
          variant: 'destructive',
        });
      }
    }
  };

  const handleEditRaffle = (raffle: Raffle) => {
    setSelectedRaffle(raffle);
    setIsCreateModalOpen(true);
  };

  const handleDeleteRaffle = async (raffleId: number) => {
    if (window.confirm('Are you sure you want to permanently delete this raffle? This action cannot be undone.')) {
      try {
        await deleteRaffleMutation.mutateAsync(raffleId);
        toast({
          title: 'Raffle Deleted',
          description: 'The raffle has been successfully deleted.',
        });
      } catch (error) {
        console.error('Error deleting raffle:', error);
        toast({
          title: 'Error',
          description: 'Failed to delete the raffle. Please try again.',
          variant: 'destructive',
        });
      }
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <Button 
          className="bg-[#FF5350] hover:bg-red-600 text-white"
          onClick={() => {
            setSelectedRaffle(null);
            setIsCreateModalOpen(true);
          }}
        >
          Create New Raffle
        </Button>
      </div>
      
      <Tabs defaultValue="active">
        <TabsList className="mb-6">
          <TabsTrigger value="active">Active Raffles</TabsTrigger>
          <TabsTrigger value="all">All Raffles</TabsTrigger>
          <TabsTrigger value="winners">Winners</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="active">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeRaffles?.map((raffle) => (
              <Card key={raffle.id} className="overflow-hidden">
                <div className="aspect-w-16 aspect-h-9 relative">
                  <img 
                    src={raffle.imageUrl} 
                    alt={raffle.title}
                    className="object-cover w-full h-48"
                  />
                  <div className="absolute top-2 right-2 bg-white/90 backdrop-filter backdrop-blur-sm px-2 py-1 rounded text-sm font-semibold">
                    {raffle.soldTickets}/{raffle.totalTickets} Tickets
                  </div>
                </div>
                <CardHeader className="pb-2">
                  <CardTitle>{raffle.title}</CardTitle>
                  <CardDescription>
                    <CountdownTimer endDate={raffle.endDate} size="sm" />
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <div>
                      <p className="text-sm text-gray-500">Regular Price</p>
                      <p className="font-semibold">{formatPrice(raffle.retailPrice)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Winner Price</p>
                      <p className="font-semibold">{formatPrice(raffle.winnerPrice)}</p>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="flex-1"
                      onClick={() => handleEditRaffle(raffle)}
                    >
                      Edit
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      className="flex-1"
                      onClick={() => handleEndRaffle(raffle.id)}
                      disabled={endRaffleMutation.isPending}
                    >
                      End Raffle
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {activeRaffles?.length === 0 && (
              <div className="col-span-full text-center py-10">
                <p className="text-gray-500 mb-4">No active raffles found</p>
                <Button 
                  variant="outline"
                  onClick={() => {
                    setSelectedRaffle(null);
                    setIsCreateModalOpen(true);
                  }}
                >
                  Create a new raffle
                </Button>
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="all">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Retail Price</TableHead>
                <TableHead>Winner Price</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Sold/Total</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allRaffles?.map((raffle) => (
                <TableRow key={raffle.id}>
                  <TableCell className="font-medium">{raffle.title}</TableCell>
                  <TableCell>{formatPrice(raffle.retailPrice)}</TableCell>
                  <TableCell>{formatPrice(raffle.winnerPrice)}</TableCell>
                  <TableCell>{raffle.endDate ? getRelativeTimeString(raffle.endDate) : 'N/A'}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${raffle.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {raffle.isActive ? 'Active' : 'Ended'}
                    </span>
                  </TableCell>
                  <TableCell>{raffle.soldTickets}/{raffle.totalTickets}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleEditRaffle(raffle)}
                      title="Edit Raffle"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    {raffle.isActive && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleEndRaffle(raffle.id)}
                        disabled={endRaffleMutation.isPending && endRaffleMutation.variables === raffle.id}
                        title="End Raffle Early"
                      >
                        {endRaffleMutation.isPending && endRaffleMutation.variables === raffle.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <StopCircle className="h-4 w-4 text-orange-600" />
                        )}
                      </Button>
                    )}
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => handleDeleteRaffle(raffle.id)}
                      disabled={deleteRaffleMutation.isPending && deleteRaffleMutation.variables === raffle.id}
                      title="Delete Raffle"
                    >
                      {deleteRaffleMutation.isPending && deleteRaffleMutation.variables === raffle.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              
              {allRaffles?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-4">
                    No raffles found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TabsContent>
        
        <TabsContent value="winners">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Raffle</TableHead>
                <TableHead>Winner</TableHead>
                <TableHead>Announced</TableHead>
                <TableHead>Claimed</TableHead>
                <TableHead>Savings</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {winners?.map((winner) => {
                const raffle = allRaffles?.find(r => r.id === winner.raffleId);
                const savings = raffle ? raffle.retailPrice - raffle.winnerPrice : 0;
                
                return (
                  <TableRow key={winner.id}>
                    <TableCell className="font-medium">{raffle?.title || 'Unknown Raffle'}</TableCell>
                    <TableCell>User #{winner.userId}</TableCell>
                    <TableCell>{getRelativeTimeString(winner.announcedAt)}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        winner.claimed 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {winner.claimed ? 'Claimed' : 'Unclaimed'}
                      </span>
                    </TableCell>
                    <TableCell>{formatPrice(savings)}</TableCell>
                  </TableRow>
                );
              })}
              
              {winners?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4">
                    No winners yet
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TabsContent>
        
        <TabsContent value="stats">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Total Raffles</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold">{allRaffles?.length || 0}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Active Raffles</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold">{activeRaffles?.length || 0}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Total Winners</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold">{winners?.length || 0}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Total Tickets Sold</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold">
                  {allRaffles?.reduce((acc, raffle) => acc + raffle.soldTickets, 0) || 0}
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      
      {isCreateModalOpen && (
        <RaffleForm 
          raffle={selectedRaffle} 
          isOpen={isCreateModalOpen}
          onClose={() => {
            setIsCreateModalOpen(false);
            setSelectedRaffle(null);
          }}
        />
      )}
    </div>
  );
};

export default AdminPanel;

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Raffle } from '@/types';
import { useCreateRaffle, useUpdateRaffle } from '@/hooks/useRaffles';
import { 
  searchPokemonCards, 
  advancedSearchCards, 
  convertCardToRaffleData, 
  PokemonCard 
} from '@/lib/pokemonAPI';
import { Loader2, Search, Filter, X } from 'lucide-react';

// Form validation schema
const formSchema = z.object({
  title: z.string().min(3, { message: 'Title must be at least 3 characters long' }),
  description: z.string().min(10, { message: 'Description must be at least 10 characters long' }),
  imageUrl: z.string().url({ message: 'Please enter a valid URL' }),
  backImageUrl: z.string().url({ message: 'Please enter a valid URL' }).optional().or(z.literal('')),
  retailPrice: z.coerce.number().positive({ message: 'Retail price must be positive' }),
  winnerPrice: z.coerce.number().positive({ message: 'Winner price must be positive' }),
  ticketPrice: z.coerce.number().positive({ message: 'Ticket price must be positive' }),
  priceSource: z.string().optional(),
  rarity: z.string().min(1, { message: 'Please select a rarity' }),
  psaGrade: z.coerce.number().int().min(1).max(10).optional(),
  psaCertNumber: z.string().optional(),
  series: z.string().optional(),
  // Keep as string in form, convert to array in onSubmit
  cardDetails: z.string(),
  totalTickets: z.coerce.number().int().positive().default(100),
  isFeatured: z.boolean().default(false),
});

// Define a custom type that matches the form schema's output structure
interface FormValues {
  title: string;
  description: string;
  imageUrl: string;
  backImageUrl?: string;
  retailPrice: number;
  winnerPrice: number;
  ticketPrice: number;
  priceSource?: string;
  rarity: string;
  psaGrade?: number;
  psaCertNumber?: string;
  series?: string;
  // This will be a string in the form but converted to array on submit
  cardDetails: string;
  totalTickets: number;
  isFeatured: boolean;
}

interface RaffleFormProps {
  raffle?: Raffle | null;
  isOpen: boolean;
  onClose: () => void;
}

const RaffleForm: React.FC<RaffleFormProps> = ({ raffle, isOpen, onClose }) => {
  const isEditing = !!raffle;
  const createRaffle = useCreateRaffle();
  const updateRaffle = useUpdateRaffle();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PokemonCard[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedCard, setSelectedCard] = useState<PokemonCard | null>(null);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [advancedSearchParams, setAdvancedSearchParams] = useState({
    rarity: '',
    set: '',
    types: [] as string[]
  });
  
  const defaultValues: Partial<FormValues> = {
    title: raffle?.title || '',
    description: raffle?.description || '',
    imageUrl: raffle?.imageUrl || '',
    backImageUrl: raffle?.backImageUrl || '',
    retailPrice: raffle?.retailPrice ? raffle.retailPrice / 100 : undefined,
    winnerPrice: raffle?.winnerPrice ? raffle.winnerPrice / 100 : undefined,
    ticketPrice: raffle?.ticketPrice ? raffle.ticketPrice / 100 : undefined,
    priceSource: raffle?.priceSource || '',
    rarity: raffle?.rarity || '',
    psaGrade: raffle?.psaGrade || undefined,
    psaCertNumber: raffle?.psaCertNumber || '',
    series: raffle?.series || '',
    // Convert array to string for the form, it will be converted back on submit
    cardDetails: raffle?.cardDetails ? raffle.cardDetails.join('\n') : '',
    totalTickets: raffle?.totalTickets || 100,
    isFeatured: raffle?.isFeatured || false,
  };
  
  // Handle basic Pokemon API search
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      // If advanced search is enabled, use that instead
      if (showAdvancedSearch) {
        const results = await advancedSearchCards({
          name: searchQuery,
          rarity: advancedSearchParams.rarity || undefined,
          set: advancedSearchParams.set || undefined,
          types: advancedSearchParams.types.length > 0 ? advancedSearchParams.types : undefined
        });
        setSearchResults(results);
      } else {
        const results = await searchPokemonCards(searchQuery);
        setSearchResults(results);
      }
    } catch (error) {
      console.error('Error searching for Pokemon cards:', error);
    } finally {
      setIsSearching(false);
    }
  };
  
  // Update advanced search params
  const updateAdvancedSearchParam = (param: string, value: string | string[]) => {
    setAdvancedSearchParams(prev => ({
      ...prev,
      [param]: value
    }));
  };
  
  // Fill form with Pokemon card data
  const selectCard = (card: PokemonCard) => {
    setSelectedCard(card);
    const raffleData = convertCardToRaffleData(card);
    form.setValue('title', raffleData.title);
    form.setValue('description', raffleData.description);
    form.setValue('imageUrl', raffleData.imageUrl);
    form.setValue('retailPrice', raffleData.retailPrice);
    form.setValue('winnerPrice', raffleData.winnerPrice);
    form.setValue('rarity', raffleData.rarity);
    form.setValue('series', raffleData.series || '');
    // Convert cardDetails array to string for the form
    form.setValue('cardDetails', raffleData.cardDetails.join('\n'));
    setSearchQuery('');
    setSearchResults([]);
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const onSubmit = async (data: FormValues) => {
    try {
      // Convert dollar amounts to cents for storage and transform cardDetails to array
      const formattedData = {
        ...data,
        retailPrice: Math.round(data.retailPrice * 100),
        winnerPrice: Math.round(data.winnerPrice * 100),
        ticketPrice: Math.round(data.ticketPrice * 100),
        // Convert string to array for API - handle cases where it might already be an array or undefined
        cardDetails: typeof data.cardDetails === 'string' 
          ? data.cardDetails.split('\n').filter(s => s.trim().length > 0)
          : Array.isArray(data.cardDetails) 
            ? data.cardDetails 
            : []
      };
      
      if (isEditing && raffle) {
        await updateRaffle.mutateAsync({
          id: raffle.id,
          data: formattedData as unknown as Partial<Raffle>
        });
      } else {
        await createRaffle.mutateAsync(formattedData as unknown as Partial<Raffle>);
      }
      
      onClose();
    } catch (error) {
      console.error('Failed to save raffle:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Raffle' : 'Create New Raffle'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update the raffle details below.' : 'Fill in the details to create a new raffle. You can search for Pokemon cards to auto-populate fields.'}
          </DialogDescription>
        </DialogHeader>
        
        {!isEditing && (
          <div className="mb-6">
            <h3 className="text-sm font-medium mb-2">Search for Pokemon Card</h3>
            <div className="flex gap-2">
              <Input
                placeholder="Search by card name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1"
              />
              <Button
                type="button"
                onClick={handleSearch}
                disabled={isSearching || !searchQuery.trim()}
                className="bg-[#FF5350] hover:bg-red-600 text-white"
              >
                {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
                className="flex items-center"
                title="Advanced search"
              >
                <Filter className="h-4 w-4" />
              </Button>
            </div>
            
            {showAdvancedSearch && (
              <div className="mt-2 p-3 border rounded-md bg-slate-50 dark:bg-gray-800">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-sm font-medium">Advanced Filters</h4>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setShowAdvancedSearch(false)}
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-medium mb-1 block">Rarity</label>
                    <Select
                      value={advancedSearchParams.rarity}
                      onValueChange={(value) => updateAdvancedSearchParam('rarity', value)}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Any rarity" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Any rarity</SelectItem>
                        <SelectItem value="Common">Common</SelectItem>
                        <SelectItem value="Uncommon">Uncommon</SelectItem>
                        <SelectItem value="Rare">Rare</SelectItem>
                        <SelectItem value="Rare Holo">Rare Holo</SelectItem>
                        <SelectItem value="Rare Ultra">Rare Ultra</SelectItem>
                        <SelectItem value="Rare Secret">Rare Secret</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-xs font-medium mb-1 block">Set</label>
                    <Input
                      placeholder="e.g., Base Set, Sword & Shield"
                      value={advancedSearchParams.set}
                      onChange={(e) => updateAdvancedSearchParam('set', e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
                
                <div className="mt-2">
                  <Button 
                    type="button" 
                    size="sm" 
                    variant="secondary"
                    onClick={handleSearch}
                    className="w-full text-xs mt-1"
                    disabled={isSearching}
                  >
                    Apply Filters
                  </Button>
                </div>
              </div>
            )}
            
            {searchResults.length > 0 && (
              <div className="mt-4 max-h-60 overflow-y-auto border rounded-md">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-2">
                  {searchResults.map((card) => (
                    <div 
                      key={card.id}
                      className="flex p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer"
                      onClick={() => selectCard(card)}
                    >
                      <img 
                        src={card.images.small} 
                        alt={card.name} 
                        className="w-12 h-16 object-contain mr-2"
                      />
                      <div className="flex flex-col">
                        <span className="font-medium text-sm">{card.name}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">{card.set.name}</span>
                        <span className="text-xs">{card.rarity}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Card Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Charizard VMAX" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Describe the card..." {...field} rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Front Image URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com/front-image.jpg" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="backImageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Back Image URL (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com/back-image.jpg" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="rarity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rarity</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select rarity" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Common">Common</SelectItem>
                        <SelectItem value="Uncommon">Uncommon</SelectItem>
                        <SelectItem value="Rare">Rare</SelectItem>
                        <SelectItem value="Holo">Holo</SelectItem>
                        <SelectItem value="Reverse Holo">Reverse Holo</SelectItem>
                        <SelectItem value="Ultra Rare">Ultra Rare</SelectItem>
                        <SelectItem value="Secret Rare">Secret Rare</SelectItem>
                        <SelectItem value="Rainbow Rare">Rainbow Rare</SelectItem>
                        <SelectItem value="Illustration Rare">Illustration Rare</SelectItem>
                        <SelectItem value="Special Illustration Rare">Special Illustration Rare</SelectItem>
                        <SelectItem value="Hyper Rare">Hyper Rare</SelectItem>
                        <SelectItem value="Full Art">Full Art</SelectItem>
                        <SelectItem value="Ultra Premium">Ultra Premium</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="p-4 border border-gray-200 rounded-md bg-gray-50 mb-4">
              <div className="mb-2">
                <h3 className="font-semibold text-gray-700">Pricing Information</h3>
                <p className="text-sm text-gray-500">Retail price is the original card price. Winner price is automatically calculated as retail price minus 40%.</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <FormField
                  control={form.control}
                  name="retailPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Retail Price ($)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          min="0" 
                          placeholder="29.99"
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            // Auto-calculate winner price as retail price minus 40%
                            const retailValue = parseFloat(e.target.value);
                            if (!isNaN(retailValue)) {
                              const winnerValue = retailValue * 0.6; // 60% of retail (40% discount)
                              form.setValue('winnerPrice', Math.round(winnerValue * 100) / 100);
                            }
                          }}
                        />
                      </FormControl>
                      <FormDescription>
                        Set to the market value of the card
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="winnerPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Winner Price ($)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          min="0" 
                          placeholder="17.99"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Automatically calculated at 60% of retail price
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="ticketPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ticket Price ($)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" min="0" placeholder="e.g., 5.00" {...field} />
                      </FormControl>
                      <FormDescription>
                        The price of a single ticket for this raffle.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="priceSource"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price Source</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value || ""}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select price source" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pricecharting">PriceCharting</SelectItem>
                        <SelectItem value="collectr">Collectr</SelectItem>
                        <SelectItem value="ebay">eBay</SelectItem>
                        <SelectItem value="psa">PSA</SelectItem>
                        <SelectItem value="tcgplayer">TCGPlayer</SelectItem>
                        <SelectItem value="manual">Manual Entry</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Source used to determine the retail price
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="series"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Series</FormLabel>
                    <FormControl>
                      <Input placeholder="Sword & Shield Series" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="totalTickets"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Tickets</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" max="1000" {...field} disabled={isEditing} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {/* PSA Grading Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border border-gray-200 rounded-md bg-gray-50">
              <div className="col-span-2 mb-2">
                <h3 className="font-semibold text-gray-700">PSA Grading Information (Optional)</h3>
              </div>
              
              <FormField
                control={form.control}
                name="psaGrade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>PSA Grade (1-10)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="1" 
                        max="10" 
                        step="1" 
                        placeholder="10"
                        {...field}
                        value={field.value === undefined ? '' : field.value}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="psaCertNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>PSA Certification Number</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="123456789"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="cardDetails"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Card Details (one per line)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="PSA Graded 9
Special Holographic Pattern
Released in 2021
Limited Print Run"
                      {...field}
                      rows={4}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="isFeatured"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel className="font-normal">Feature this raffle on the homepage</FormLabel>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter className="mt-6">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                disabled={form.formState.isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                className="bg-[#FF5350] hover:bg-red-600 text-white"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting
                  ? 'Saving...'
                  : isEditing
                    ? 'Update Raffle'
                    : 'Create Raffle'
                }
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default RaffleForm;

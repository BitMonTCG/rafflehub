import axios from 'axios';

// Main Pokemon TCG API URL
const POKEMON_TCG_API_URL = 'https://api.pokemontcg.io/v2';

// API key for higher rate limits
const API_KEY = import.meta.env.VITE_POKEMON_TCG_API_KEY;

// Create axios instance with auth header
const pokemonApiClient = axios.create({
  baseURL: POKEMON_TCG_API_URL,
  headers: {
    'X-Api-Key': API_KEY
  }
});

// Interface for card data returned from API
export interface PokemonCard {
  id: string;
  name: string;
  images: {
    small: string;
    large: string;
  };
  rarity: string;
  set: {
    name: string;
    series: string;
  };
  cardmarket?: {
    prices?: {
      averageSellPrice?: number;
      avg1?: number;
      avg7?: number;
      avg30?: number;
      trendPrice?: number;
    };
  };
  tcgplayer?: {
    prices?: any;
    url?: string;
  };
}

/**
 * Search for Pokemon cards by name
 * @param name Card name to search for
 * @returns Promise with card data
 */
export async function searchPokemonCards(name: string): Promise<PokemonCard[]> {
  try {
    const response = await pokemonApiClient.get('/cards', {
      params: {
        q: `name:"${name}"`,
        pageSize: 20
      }
    });
    
    return response.data.data;
  } catch (error) {
    console.error('Error fetching Pokemon cards:', error);
    return [];
  }
}

/**
 * Get a single Pokemon card by ID
 * @param id Card ID
 * @returns Promise with card data
 */
export async function getPokemonCardById(id: string): Promise<PokemonCard | null> {
  try {
    const response = await pokemonApiClient.get(`/cards/${id}`);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching Pokemon card by ID:', error);
    return null;
  }
}

/**
 * Advanced search for Pokemon cards with multiple parameters
 * @param params Search parameters
 * @returns Promise with card data
 */
export async function advancedSearchCards(params: { 
  name?: string;
  rarity?: string;
  set?: string;
  types?: string[];
}): Promise<PokemonCard[]> {
  try {
    const queryParts = [];
    
    if (params.name) queryParts.push(`name:"${params.name}"`);
    if (params.rarity) queryParts.push(`rarity:"${params.rarity}"`);
    if (params.set) queryParts.push(`set.name:"${params.set}"`);
    if (params.types && params.types.length > 0) {
      const typesQuery = params.types.map(t => `types:"${t}"`).join(' OR ');
      queryParts.push(`(${typesQuery})`);
    }
    
    const query = queryParts.join(' ');
    
    const response = await pokemonApiClient.get('/cards', {
      params: {
        q: query,
        pageSize: 30,
        orderBy: '-set.releaseDate'
      }
    });
    
    return response.data.data;
  } catch (error) {
    console.error('Error performing advanced search for Pokemon cards:', error);
    return [];
  }
}

/**
 * Convert a Pokemon card to our raffle format
 * @param card Pokemon card data from API
 * @returns Raffle data ready for submission
 */
export function convertCardToRaffleData(card: PokemonCard) {
  // Calculate prices (from cardmarket if available, otherwise use default pricing)
  let retailPrice = 2999; // Default $29.99
  if (card.cardmarket?.prices?.trendPrice) {
    retailPrice = Math.round(card.cardmarket.prices.trendPrice * 100);
  } else if (card.tcgplayer?.prices) {
    // Try to get price from tcgplayer if available
    const priceTypes = Object.keys(card.tcgplayer.prices);
    if (priceTypes.length > 0 && card.tcgplayer.prices[priceTypes[0]].market) {
      retailPrice = Math.round(card.tcgplayer.prices[priceTypes[0]].market * 100);
    }
  }
  
  // Winner pays retail price minus 40%
  const winnerPrice = Math.round(retailPrice * 0.6); // 60% of retail price (40% discount)
  
  // Get card details
  const cardDetails = [
    `Set: ${card.set.name}`,
    `Rarity: ${card.rarity}`,
    `Series: ${card.set.series}`,
    `Card ID: ${card.id}`
  ];
  
  return {
    title: card.name,
    description: `Authentic ${card.name} card from the ${card.set.name} set. This ${card.rarity} card features stunning artwork and is sought after by collectors worldwide.`,
    imageUrl: card.images.large,
    retailPrice,
    winnerPrice,
    rarity: card.rarity,
    series: card.set.series,
    cardDetails,
    totalTickets: 100,
    isActive: true,
    isFeatured: false
  };
}
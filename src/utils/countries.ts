export interface CountryData {
  name: string;
  code: string;
  dialCode: string;
  flag: string;
  currency: string;
  currencySymbol: string;
  towns: string[];
  phonePlaceholder: string;
  phoneFormatHelp: string;
}

export const COUNTRIES: CountryData[] = [
  {
    name: 'Cameroon',
    code: 'CM',
    dialCode: '+237',
    flag: '🇨🇲',
    currency: 'XAF',
    currencySymbol: 'FCFA',
    towns: ['Bamenda', 'Douala', 'Yaoundé', 'Buea', 'Limbe', 'Bafoussam', 'Garoua', 'Kumba'],
    phonePlaceholder: '+237 6XX XXX XXX',
    phoneFormatHelp: 'MTN or Orange Mobile'
  },
  {
    name: 'Nigeria',
    code: 'NG',
    dialCode: '+234',
    flag: '🇳🇬',
    currency: 'NGN',
    currencySymbol: '₦',
    towns: ['Lagos', 'Abuja', 'Port Harcourt', 'Ibadan', 'Enugu', 'Benin City', 'Calabar', 'Kano'],
    phonePlaceholder: '+234 8XX XXX XXXX',
    phoneFormatHelp: 'MTN, Airtel or Glo'
  },
  {
    name: "Côte d'Ivoire",
    code: 'CI',
    dialCode: '+225',
    flag: '🇨🇮',
    currency: 'XOF',
    currencySymbol: 'FCFA',
    towns: ['Abidjan', 'Yamoussoukro', 'Bouaké', 'San-Pédro', 'Korhogo', 'Daloa'],
    phonePlaceholder: '+225 0X XX XX XX XX',
    phoneFormatHelp: 'Orange, MTN ou Moov'
  },
  {
    name: 'Senegal',
    code: 'SN',
    dialCode: '+221',
    flag: '🇸🇳',
    currency: 'XOF',
    currencySymbol: 'FCFA',
    towns: ['Dakar', 'Saint-Louis', 'Thiès', 'Touba', 'Ziguinchor', 'Mbour'],
    phonePlaceholder: '+221 7X XXX XX XX',
    phoneFormatHelp: 'Orange ou Free Sénégal'
  },
  {
    name: 'Ghana',
    code: 'GH',
    dialCode: '+233',
    flag: '🇬🇭',
    currency: 'GHS',
    currencySymbol: 'GH₵',
    towns: ['Accra', 'Kumasi', 'Takoradi', 'Tamale', 'Tema', 'Cape Coast'],
    phonePlaceholder: '+233 2X XXX XXXX',
    phoneFormatHelp: 'MTN or Telecel Ghana'
  },
  {
    name: 'France',
    code: 'FR',
    dialCode: '+33',
    flag: '🇫🇷',
    currency: 'EUR',
    currencySymbol: '€',
    towns: ['Paris', 'Lyon', 'Marseille', 'Toulouse', 'Bordeaux', 'Nice', 'Lille', 'Strasbourg'],
    phonePlaceholder: '+33 6 XX XX XX XX',
    phoneFormatHelp: 'Mobile français'
  },
  {
    name: 'United States',
    code: 'US',
    dialCode: '+1',
    flag: '🇺🇸',
    currency: 'USD',
    currencySymbol: '$',
    towns: ['New York', 'Atlanta', 'Houston', 'Los Angeles', 'Chicago', 'Miami', 'Dallas', 'Washington DC'],
    phonePlaceholder: '+1 (XXX) XXX-XXXX',
    phoneFormatHelp: 'US Mobile'
  },
  {
    name: 'Canada',
    code: 'CA',
    dialCode: '+1',
    flag: '🇨🇦',
    currency: 'CAD',
    currencySymbol: '$',
    towns: ['Montreal', 'Toronto', 'Ottawa', 'Vancouver', 'Calgary', 'Quebec City', 'Edmonton'],
    phonePlaceholder: '+1 (XXX) XXX-XXXX',
    phoneFormatHelp: 'Canadian Mobile'
  },
  {
    name: 'United Kingdom',
    code: 'GB',
    dialCode: '+44',
    flag: '🇬🇧',
    currency: 'GBP',
    currencySymbol: '£',
    towns: ['London', 'Manchester', 'Birmingham', 'Leeds', 'Glasgow', 'Liverpool', 'Edinburgh'],
    phonePlaceholder: '+44 7XXX XXXXXX',
    phoneFormatHelp: 'UK Mobile'
  },
  {
    name: 'Gabon',
    code: 'GA',
    dialCode: '+241',
    flag: '🇬🇦',
    currency: 'XAF',
    currencySymbol: 'FCFA',
    towns: ['Libreville', 'Port-Gentil', 'Franceville', 'Oyem', 'Moanda'],
    phonePlaceholder: '+241 6X XX XX XX',
    phoneFormatHelp: 'Airtel ou Moov Gabon'
  },
  {
    name: 'DR Congo',
    code: 'CD',
    dialCode: '+243',
    flag: '🇨🇩',
    currency: 'USD',
    currencySymbol: '$',
    towns: ['Kinshasa', 'Lubumbashi', 'Goma', 'Kisangani', 'Bukavu', 'Matadi'],
    phonePlaceholder: '+243 8X XXX XXXX',
    phoneFormatHelp: 'Vodacom, Airtel ou Orange RDC'
  },
  {
    name: 'South Africa',
    code: 'ZA',
    dialCode: '+27',
    flag: '🇿🇦',
    currency: 'ZAR',
    currencySymbol: 'R',
    towns: ['Johannesburg', 'Cape Town', 'Durban', 'Pretoria', 'Port Elizabeth', 'Bloemfontein'],
    phonePlaceholder: '+27 8X XXX XXXX',
    phoneFormatHelp: 'Vodacom or MTN SA'
  },
  {
    name: 'Other Worldwide',
    code: 'XX',
    dialCode: '+',
    flag: '🌍',
    currency: 'USD',
    currencySymbol: '$',
    towns: ['Capital City', 'Other City'],
    phonePlaceholder: '+Country Code Phone',
    phoneFormatHelp: 'International Mobile'
  }
];

export function getCountryByName(name: string): CountryData {
  return COUNTRIES.find(c => c.name.toLowerCase() === name.toLowerCase()) || COUNTRIES[0];
}

export function getCountryByCode(code: string): CountryData {
  return COUNTRIES.find(c => c.code.toLowerCase() === code.toLowerCase()) || COUNTRIES[0];
}

import axios from 'axios';
import winston from 'winston';

// Configure logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

class OpenFDAService {
  constructor() {
    this.baseURL = process.env.OPENFDA_API_URL || 'https://api.fda.gov/drug/label.json';
    this.timeout = 10000; // 10 seconds
    this.retryAttempts = 3;
    this.retryDelay = 1000; // 1 second
  }

  /**
   * Search for drug information by generic name
   * @param {string} genericName - The generic name of the drug
   * @param {number} limit - Maximum number of results to return
   * @returns {Promise<Object>} Drug information from OpenFDA
   */
  async searchByGenericName(genericName, limit = 1) {
    try {
      const query = encodeURIComponent(genericName);
      const url = `${this.baseURL}?search=openfda.generic_name:${query}&limit=${limit}`;
      
      logger.info(`Searching OpenFDA for generic name: ${genericName}`);
      
      const response = await this.makeRequest(url);
      
      if (response.data && response.data.results && response.data.results.length > 0) {
        const drugInfo = response.data.results[0];
        logger.info(`Found drug information for: ${genericName}`);
        return this.formatDrugInfo(drugInfo);
      } else {
        logger.warn(`No drug information found for: ${genericName}`);
        return null;
      }
    } catch (error) {
      logger.error(`Error searching OpenFDA for ${genericName}:`, error.message);
      throw new Error(`Failed to fetch drug information: ${error.message}`);
    }
  }

  /**
   * Search for drug information by brand name
   * @param {string} brandName - The brand name of the drug
   * @param {number} limit - Maximum number of results to return
   * @returns {Promise<Object>} Drug information from OpenFDA
   */
  async searchByBrandName(brandName, limit = 1) {
    try {
      const query = encodeURIComponent(brandName);
      const url = `${this.baseURL}?search=openfda.brand_name:${query}&limit=${limit}`;
      
      logger.info(`Searching OpenFDA for brand name: ${brandName}`);
      
      const response = await this.makeRequest(url);
      
      if (response.data && response.data.results && response.data.results.length > 0) {
        const drugInfo = response.data.results[0];
        logger.info(`Found drug information for: ${brandName}`);
        return this.formatDrugInfo(drugInfo);
      } else {
        logger.warn(`No drug information found for: ${brandName}`);
        return null;
      }
    } catch (error) {
      logger.error(`Error searching OpenFDA for ${brandName}:`, error.message);
      throw new Error(`Failed to fetch drug information: ${error.message}`);
    }
  }

  /**
   * Search for drug information by NDC (National Drug Code)
   * @param {string} ndc - The NDC code
   * @param {number} limit - Maximum number of results to return
   * @returns {Promise<Object>} Drug information from OpenFDA
   */
  async searchByNDC(ndc, limit = 1) {
    try {
      const query = encodeURIComponent(ndc);
      const url = `${this.baseURL}?search=openfda.product_ndc:${query}&limit=${limit}`;
      
      logger.info(`Searching OpenFDA for NDC: ${ndc}`);
      
      const response = await this.makeRequest(url);
      
      if (response.data && response.data.results && response.data.results.length > 0) {
        const drugInfo = response.data.results[0];
        logger.info(`Found drug information for NDC: ${ndc}`);
        return this.formatDrugInfo(drugInfo);
      } else {
        logger.warn(`No drug information found for NDC: ${ndc}`);
        return null;
      }
    } catch (error) {
      logger.error(`Error searching OpenFDA for NDC ${ndc}:`, error.message);
      throw new Error(`Failed to fetch drug information: ${error.message}`);
    }
  }

  /**
   * Search for drug information by manufacturer
   * @param {string} manufacturer - The manufacturer name
   * @param {number} limit - Maximum number of results to return
   * @returns {Promise<Object>} Drug information from OpenFDA
   */
  async searchByManufacturer(manufacturer, limit = 1) {
    try {
      const query = encodeURIComponent(manufacturer);
      const url = `${this.baseURL}?search=openfda.manufacturer_name:${query}&limit=${limit}`;
      
      logger.info(`Searching OpenFDA for manufacturer: ${manufacturer}`);
      
      const response = await this.makeRequest(url);
      
      if (response.data && response.data.results && response.data.results.length > 0) {
        const drugInfo = response.data.results[0];
        logger.info(`Found drug information for manufacturer: ${manufacturer}`);
        return this.formatDrugInfo(drugInfo);
      } else {
        logger.warn(`No drug information found for manufacturer: ${manufacturer}`);
        return null;
      }
    } catch (error) {
      logger.error(`Error searching OpenFDA for manufacturer ${manufacturer}:`, error.message);
      throw new Error(`Failed to fetch drug information: ${error.message}`);
    }
  }

  /**
   * Search for drug information using multiple criteria
   * @param {Object} criteria - Search criteria
   * @param {string} criteria.genericName - Generic name
   * @param {string} criteria.brandName - Brand name
   * @param {string} criteria.manufacturer - Manufacturer
   * @param {string} criteria.ndc - NDC code
   * @param {number} limit - Maximum number of results to return
   * @returns {Promise<Object>} Drug information from OpenFDA
   */
  async searchByCriteria(criteria, limit = 1) {
    try {
      const searchTerms = [];
      
      if (criteria.genericName) {
        searchTerms.push(`openfda.generic_name:${encodeURIComponent(criteria.genericName)}`);
      }
      
      if (criteria.brandName) {
        searchTerms.push(`openfda.brand_name:${encodeURIComponent(criteria.brandName)}`);
      }
      
      if (criteria.manufacturer) {
        searchTerms.push(`openfda.manufacturer_name:${encodeURIComponent(criteria.manufacturer)}`);
      }
      
      if (criteria.ndc) {
        searchTerms.push(`openfda.product_ndc:${encodeURIComponent(criteria.ndc)}`);
      }

      if (searchTerms.length === 0) {
        throw new Error('At least one search criteria must be provided');
      }

      const query = searchTerms.join('+AND+');
      const url = `${this.baseURL}?search=${query}&limit=${limit}`;
      
      logger.info(`Searching OpenFDA with criteria:`, criteria);
      
      const response = await this.makeRequest(url);
      
      if (response.data && response.data.results && response.data.results.length > 0) {
        const drugInfo = response.data.results[0];
        logger.info(`Found drug information with criteria`);
        return this.formatDrugInfo(drugInfo);
      } else {
        logger.warn(`No drug information found with criteria`);
        return null;
      }
    } catch (error) {
      logger.error(`Error searching OpenFDA with criteria:`, error.message);
      throw new Error(`Failed to fetch drug information: ${error.message}`);
    }
  }

  /**
   * Get drug information by medicine name (tries multiple search methods)
   * @param {string} medicineName - The medicine name to search for
   * @returns {Promise<Object>} Drug information from OpenFDA
   */
  async getDrugInfo(medicineName) {
    try {
      // Clean the medicine name
      const cleanName = medicineName.trim().toLowerCase();
      
      // Try different search strategies
      const searchStrategies = [
        () => this.searchByGenericName(cleanName),
        () => this.searchByBrandName(cleanName),
        () => this.searchByGenericName(cleanName.split(' ')[0]), // Try first word only
        () => this.searchByBrandName(cleanName.split(' ')[0]), // Try first word only
      ];

      for (const strategy of searchStrategies) {
        try {
          const result = await strategy();
          if (result) {
            return result;
          }
        } catch (error) {
          logger.warn(`Search strategy failed: ${error.message}`);
          continue;
        }
      }

      logger.warn(`No drug information found for: ${medicineName}`);
      return null;
    } catch (error) {
      logger.error(`Error getting drug information for ${medicineName}:`, error.message);
      throw new Error(`Failed to fetch drug information: ${error.message}`);
    }
  }

  /**
   * Make HTTP request with retry logic
   * @param {string} url - The URL to request
   * @returns {Promise<Object>} HTTP response
   */
  async makeRequest(url) {
    let lastError;
    
    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        const response = await axios.get(url, {
          timeout: this.timeout,
          headers: {
            'User-Agent': 'Medical-Inventory-System/1.0'
          }
        });
        
        return response;
      } catch (error) {
        lastError = error;
        
        if (attempt < this.retryAttempts) {
          logger.warn(`Request attempt ${attempt} failed, retrying in ${this.retryDelay}ms...`);
          await this.delay(this.retryDelay);
        }
      }
    }
    
    throw lastError;
  }

  /**
   * Format drug information from OpenFDA response
   * @param {Object} drugInfo - Raw drug information from OpenFDA
   * @returns {Object} Formatted drug information
   */
  formatDrugInfo(drugInfo) {
    const openfda = drugInfo.openfda || {};
    
    return {
      genericName: openfda.generic_name?.[0] || null,
      brandName: openfda.brand_name?.[0] || null,
      manufacturer: openfda.manufacturer_name?.[0] || null,
      ndc: openfda.product_ndc?.[0] || null,
      description: drugInfo.description?.[0] || null,
      indications: drugInfo.indications_and_usage || [],
      warnings: drugInfo.warnings || [],
      dosageForm: openfda.dosage_form?.[0] || null,
      route: openfda.route?.[0] || null,
      strength: openfda.strength?.[0] || null,
      activeIngredient: openfda.active_ingredient?.[0] || null,
      productType: openfda.product_type?.[0] || null,
      applicationNumber: openfda.application_number?.[0] || null,
      packageNdc: openfda.package_ndc || [],
      splId: drugInfo.spl_id || null,
      splSetId: drugInfo.spl_set_id || null,
      effectiveTime: drugInfo.effective_time || null,
      version: drugInfo.version || null,
      rawData: drugInfo // Include raw data for reference
    };
  }

  /**
   * Delay execution for specified milliseconds
   * @param {number} ms - Milliseconds to delay
   * @returns {Promise<void>}
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Validate OpenFDA service health
   * @returns {Promise<boolean>} Service health status
   */
  async checkHealth() {
    try {
      const url = `${this.baseURL}?limit=1`;
      const response = await this.makeRequest(url);
      return response.status === 200;
    } catch (error) {
      logger.error('OpenFDA service health check failed:', error.message);
      return false;
    }
  }

  /**
   * Get service statistics
   * @returns {Object} Service statistics
   */
  getStats() {
    return {
      baseURL: this.baseURL,
      timeout: this.timeout,
      retryAttempts: this.retryAttempts,
      retryDelay: this.retryDelay
    };
  }
}

// Create singleton instance
const openFDAService = new OpenFDAService();

export default openFDAService;


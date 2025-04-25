
function displayMessage(sender, text, cls) {
    const chatbox = document.getElementById("chatbox");
    const div = document.createElement("div");
    div.classList.add("message");
    
    if (cls === "bot") {
        div.innerHTML = `<span class="label">${sender}:</span> <span class="message-content"></span>`;
        chatbox.appendChild(div);
        
        chatbox.scrollTop = chatbox.scrollHeight;
        
        const messageContent = div.querySelector('.message-content');
        let i = 0;
        const typingInterval = setInterval(() => {
            if (i < text.length) {
                messageContent.textContent += text.charAt(i);
                i++;
            } else {
                clearInterval(typingInterval);
            }
        }, 10);
    } else {
        div.innerHTML = `<span class="label">${sender}:</span> ${text}`;
        chatbox.appendChild(div);
        chatbox.scrollTop = chatbox.scrollHeight;
    }
}
  

const API_KEY = "AIzaSyBluf64DuO2XkTQuVpBO0NHixv2G_WR8lI";  
  

document.getElementById('userInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        sendMessage();
    }
});


let conversationHistory = [];
let currentTopic = null;
let map = null;
let selectedMarker = null;


document.addEventListener('DOMContentLoaded', function() {
    
    map = L.map('map').setView([20.5937, 78.9629], 5);
    
   
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        className: 'vintage-map'  // Add custom class for styling
    }).addTo(map);

    // Add custom CSS for vintage effect
    const style = document.createElement('style');
    style.textContent = `
        .vintage-map {
            filter: sepia(30%) brightness(90%) contrast(90%);
        }
        .leaflet-container {
            background-color: #e8e8e8 !important;
        }
        .leaflet-control-zoom {
            border: 2px solid #8B4513 !important;
            background-color: #f5f5dc !important;
        }
        .leaflet-control-zoom a {
            color: #8B4513 !important;
            background-color: #f5f5dc !important;
        }
        .leaflet-control-zoom a:hover {
            background-color: #e8e8e8 !important;
        }
        .leaflet-marker-icon {
            filter: sepia(50%) brightness(80%) contrast(120%);
        }
    `;
    document.head.appendChild(style);

    // Add click handler to map
    map.on('click', function(e) {
        // Remove previous marker if exists
        if (selectedMarker) {
            map.removeLayer(selectedMarker);
        }

        // Add new marker with vintage style
        selectedMarker = L.marker(e.latlng, {
            icon: L.divIcon({
                className: 'vintage-marker',
                html: '<div style="background-color: #8B4513; width: 12px; height: 12px; border-radius: 50%; border: 2px solid #f5f5dc;"></div>',
                iconSize: [16, 16]
            })
        }).addTo(map);
        
        // Get location information using reverse geocoding
        getLocationInfo(e.latlng.lat, e.latlng.lng);
    });
});

// Function to clear map selection
function clearMapSelection() {
    if (selectedMarker) {
        map.removeLayer(selectedMarker);
        selectedMarker = null;
    }
    // Reset gallery to initial state
    const galleryContainer = document.getElementById('galleryContainer');
    galleryContainer.innerHTML = '<div class="gallery-placeholder">Select a location on the map to view historical images</div>';
}

// Function to fetch images from Unsplash
async function fetchUnsplashImages(locationName) {
    try {
        // For now, return empty array since we don't have an API key
        return [];
    } catch (error) {
        console.error("Error fetching Unsplash images:", error);
        return [];
    }
}

// Function to fetch images from Pixabay
async function fetchPixabayImages(locationName) {
    try {
        // For now, return empty array since we don't have an API key
        return [];
    } catch (error) {
        console.error("Error fetching Pixabay images:", error);
        return [];
    }
}

// Function to fetch images from Wikipedia
async function fetchWikiImages(locationName) {
    try {
        // First, try to find monuments and landmarks
        const monumentSearchResponse = await fetch(
            `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(locationName + ' monument OR landmark OR historical site')}&format=json&origin=*`
        );
        const monumentSearchData = await monumentSearchResponse.json();
        
        let pageId;
        let isMonumentSearch = true;

        if (!monumentSearchData.query?.search?.length) {
            // If no monuments found, search for the city itself
            console.log("No monuments found, searching for city images:", locationName);
            const citySearchResponse = await fetch(
                `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(locationName)}&format=json&origin=*`
            );
            const citySearchData = await citySearchResponse.json();
            
            if (!citySearchData.query?.search?.length) {
                console.log("No results found for:", locationName);
                return [];
            }
            
            pageId = citySearchData.query.search[0].pageid;
            isMonumentSearch = false;
        } else {
            pageId = monumentSearchData.query.search[0].pageid;
        }

        const imageResponse = await fetch(
            `https://en.wikipedia.org/w/api.php?action=query&prop=images&pageids=${pageId}&format=json&origin=*`
        );
        const imageData = await imageResponse.json();
        
        if (!imageData.query?.pages?.[pageId]?.images) {
            console.log("No images found for page:", pageId);
            return [];
        }

        const imageTitles = imageData.query.pages[pageId].images.map(img => img.title);
        
        // Get image URLs
        const images = await Promise.all(
            imageTitles
                .filter(title => {
                    const lowerTitle = title.toLowerCase();
                    // Filter out unwanted images
                    const unwanted = [
                        'icon', 'logo', 'svg', 'map', 'flag', 'coat of arms', 'emblem',
                        'seal', 'symbol', 'banner', 'sign', 'diagram', 'chart', 'graph'
                    ];

                    if (isMonumentSearch) {
                        // For monument search, look for monument-related keywords
                        const monumentKeywords = [
                            'monument', 'temple', 'fort', 'palace', 'mosque', 'church',
                            'cathedral', 'tower', 'statue', 'ruin', 'archaeological',
                            'heritage', 'historic', 'ancient', 'architecture'
                        ];
                        return !unwanted.some(word => lowerTitle.includes(word)) &&
                               monumentKeywords.some(word => lowerTitle.includes(word));
                    } else {
                        // For city search, look for city-related keywords
                        const cityKeywords = [
                            'city', 'view', 'skyline', 'landscape', 'street', 'building',
                            'architecture', 'downtown', 'center', 'square', 'market',
                            'river', 'bridge', 'park', 'garden'
                        ];
                        return !unwanted.some(word => lowerTitle.includes(word)) &&
                               cityKeywords.some(word => lowerTitle.includes(word));
                    }
                })
                .slice(0, 5)
                .map(async title => {
                    try {
                        const imageInfoResponse = await fetch(
                            `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=imageinfo&iiprop=url&format=json&origin=*`
                        );
                        const imageInfoData = await imageInfoResponse.json();
                        const pages = imageInfoData.query.pages;
                        const pageId = Object.keys(pages)[0];
                        
                        if (pages[pageId].imageinfo) {
                            return {
                                url: pages[pageId].imageinfo[0].url,
                                title: title.replace('File:', ''),
                                source: 'Wikipedia',
                                description: isMonumentSearch 
                                    ? `Historical monument in ${locationName}`
                                    : `View of ${locationName}`
                            };
                        }
                    } catch (error) {
                        console.error("Error fetching Wikipedia image:", error);
                    }
                    return null;
                })
        );

        return images.filter(img => img !== null);
    } catch (error) {
        console.error("Error fetching Wikipedia images:", error);
        return [];
    }
}

// Update the main image fetching function
async function fetchHistoricalImages(locationName) {
    console.log("Fetching images for:", locationName);
    try {
        // Try all three sources simultaneously
        const [wikiImages, unsplashImages, pixabayImages] = await Promise.all([
            fetchWikiImages(locationName),
            fetchUnsplashImages(locationName),
            fetchPixabayImages(locationName)
        ]);

        console.log("Images found:", {
            wiki: wikiImages.length,
            unsplash: unsplashImages.length,
            pixabay: pixabayImages.length
        });

        // Combine and deduplicate images
        const allImages = [...wikiImages, ...unsplashImages, ...pixabayImages];
        const uniqueImages = Array.from(new Set(allImages.map(img => img.url)))
            .map(url => allImages.find(img => img.url === url));

        console.log("Total unique images:", uniqueImages.length);
        return uniqueImages.slice(0, 10); // Return up to 10 unique images
    } catch (error) {
        console.error("Error fetching images:", error);
        return [];
    }
}

// Update the display function
async function displayHistoricalImages(locationName) {
    const galleryContainer = document.getElementById('galleryContainer');
    
    // Clear previous images and show loading state
    galleryContainer.innerHTML = '<div class="gallery-placeholder">Searching for images...</div>';
    
    try {
        const images = await fetchHistoricalImages(locationName);
        
        if (images.length === 0) {
            galleryContainer.innerHTML = '<div class="gallery-placeholder">No images found for this location. Try searching for a different location.</div>';
            return;
        }
        
        // Display images in grid
        galleryContainer.innerHTML = '';
        images.forEach(image => {
            if (image && image.url) {
                const galleryItem = document.createElement('div');
                galleryItem.className = 'gallery-item';
                
                // Create image element
                const img = document.createElement('img');
                img.src = image.url;
                img.alt = image.title;
                img.title = image.description || image.title;
                
                // Create source label
                const sourceLabel = document.createElement('div');
                sourceLabel.className = 'image-source';
                sourceLabel.textContent = image.description || image.title;
                
                galleryItem.appendChild(img);
                galleryItem.appendChild(sourceLabel);
                
                // Add click handler to show larger image
                galleryItem.addEventListener('click', () => {
                    window.open(image.url, '_blank');
                });
                
                galleryContainer.appendChild(galleryItem);
            }
        });
    } catch (error) {
        console.error("Error displaying images:", error);
        galleryContainer.innerHTML = '<div class="gallery-placeholder">Error loading images. Please try again.</div>';
    }
}

// Update getLocationInfo function to include image gallery
async function getLocationInfo(lat, lng) {
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`, {
            headers: {
                'Accept-Language': 'en-US,en;q=0.9',
                'User-Agent': 'LocalHistoryBot/1.0'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data && data.address) {
            const locationInfo = {
                state: data.address.state || data.address.region || 'Unknown State',
                district: data.address.county || data.address.city || data.address.town || data.address.village || 'Unknown District',
                pincode: data.address.postcode || 'Unknown',
                display_name: data.display_name || 'Selected Location'
            };

            // Display the selected location information
            displayMessage("Folk Historian", 
                `You've selected a location in ${locationInfo.district}, ${locationInfo.state}. ` +
                `Pincode: ${locationInfo.pincode}. Would you like to know more about this location's history?`, 
                "bot");

            // Add to conversation history
            conversationHistory.push({
                role: "assistant",
                parts: [{ text: `Location selected: ${locationInfo.district}, ${locationInfo.state} (Pincode: ${locationInfo.pincode})` }]
            });

            // Display historical images
            await displayHistoricalImages(`${locationInfo.district} ${locationInfo.state}`);
        } else {
            throw new Error('No address information found');
        }
    } catch (error) {
        console.error("Error getting location info:", error);
        displayMessage("Folk Historian", 
            "⚠️ I'm having trouble getting detailed information about this location. " +
            "Please try selecting a different spot on the map or enter the pincode directly.", 
            "bot");
    }
}

// Function to check if message contains a pincode
function containsPincode(message) {
    // Indian pincodes are 6 digits
    const pincodeRegex = /\b\d{6}\b/;
    return pincodeRegex.test(message);
}

// Function to get coordinates for a location
async function getCoordinatesForLocation(locationName) {
    try {
        console.log("Searching for coordinates of:", locationName);
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationName + ', India')}&limit=1`,
            {
                headers: {
                    'Accept-Language': 'en-US,en;q=0.9',
                    'User-Agent': 'LocalHistoryBot/1.0'
                }
            }
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log("Coordinates response:", data);
        
        if (data && data.length > 0) {
            const coordinates = {
                lat: parseFloat(data[0].lat),
                lng: parseFloat(data[0].lon)
            };
            console.log("Found coordinates:", coordinates);
            return coordinates;
        }
        console.log("No coordinates found for:", locationName);
        return null;
    } catch (error) {
        console.error("Error getting coordinates:", error);
        return null;
    }
}

// Function to center map on location
async function centerMapOnLocation(locationName) {
    try {
        console.log("Attempting to center map on:", locationName);
        
        if (!map) {
            console.error("Map is not initialized");
            return;
        }

        const coordinates = await getCoordinatesForLocation(locationName);
        if (!coordinates) {
            console.error("Could not get coordinates for:", locationName);
            return;
        }

        // Clear any existing markers
        if (selectedMarker) {
            map.removeLayer(selectedMarker);
        }

        // Center the map on the location
        map.setView([coordinates.lat, coordinates.lng], 12);
        console.log("Map centered on:", coordinates);

        // Add a marker at the location
        selectedMarker = L.marker([coordinates.lat, coordinates.lng], {
            icon: L.divIcon({
                className: 'vintage-marker',
                html: '<div style="background-color: #8B4513; width: 12px; height: 12px; border-radius: 50%; border: 2px solid #f5f5dc;"></div>',
                iconSize: [16, 16]
            })
        }).addTo(map);
        console.log("Marker added at:", coordinates);

        // Get location information
        await getLocationInfo(coordinates.lat, coordinates.lng);
    } catch (error) {
        console.error("Error centering map:", error);
    }
}

async function sendMessage() {
    const input = document.getElementById('userInput');
    const userMessage = input.value.trim();
  
    if (!userMessage) return;
  
    // Display the user's message
    displayMessage("You", userMessage, "user");
  
    // Add user message to conversation history
    conversationHistory.push({
        role: "user",
        parts: [{ text: userMessage }]
    });

    // Check if message contains a pincode
    const pincodeMatch = userMessage.match(/\b\d{6}\b/);
    const pincode = pincodeMatch ? pincodeMatch[0] : null;

    // Extract location name from the message
    const locationMatch = userMessage.match(/(?:show|tell|about|history|images|pictures|photos|of|in|from)\s+([^,.!?]+)/i);
    const locationName = locationMatch ? locationMatch[1].trim() : null;

    // If a location is mentioned, center the map on it
    if (locationName) {
        console.log("Location detected in message:", locationName);
        await centerMapOnLocation(locationName);
    }
  
    // The system prompt with context handling and pincode support
    const systemPrompt = pincode ? `
You are a Local History Educator Chatbot specializing in Indian locations and their history. When provided with a pincode, provide detailed information about that location including:

1. The state and district where this pincode is located
2. Historical significance of the area
3. Important landmarks or monuments
4. Cultural aspects and traditions
5. Any notable historical events that took place there

Pincode: ${pincode}

Please provide a comprehensive but concise overview of this location's history and significance. Keep the response under 200 words unless more details are requested.
` : `
You are a Local History Educator Chatbot created by div. This bot was developed using the Gemini API to provide historical information about  locations and their rich heritage.

When users ask about the creator or owner of this bot, respond with: "This Local History Educator Chatbot was created by Divyanshu Ranjan using the Gemini API. It's designed to share the rich historical heritage of  locations with users like you."
keep it domain specific and avoid generic responses.
When users ask about the bot's capabilities, respond with: "I can provide historical information about locations, including their significance, landmarks, and cultural aspects. Just ask me about a specific location or its history!"
For other questions, follow these guidelines:
1. Keep answers concise and under 200 words unless the user specifically asks for more details
2. Focus on the most important and interesting aspects of the topic
3. If the user asks for more information, then provide deeper insights
4. Always maintain historical accuracy while being brief
5. End with a brief invitation for more information if relevant

Previous conversation context:
${conversationHistory.map(msg => `${msg.role}: ${msg.parts[0].text}`).join('\n')}

User question: ${userMessage}

Provide a concise, engaging response that directly addresses the question while staying under 200 words unless more details are requested.
`;
 
    try {
      // Make the API call to Gemini 2.0 Flash model
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: systemPrompt
                }
              ]
            }
          ]
        })
      });
  
      // Parse the response from the API
      const data = await res.json();
      const botReply = data?.candidates?.[0]?.content?.parts?.[0]?.text 
                      || "I apologize, but I couldn't find information about that location. Please try another pincode or ask a different question.";
  
      // Add bot response to conversation history
      conversationHistory.push({
          role: "assistant",
          parts: [{ text: botReply }]
      });
  
      // Display the historian's response
      displayMessage("Folk Historian", botReply, "bot");

      // If a location was mentioned in the message, show its images
      if (locationName) {
        displayHistoricalImages(locationName);
      }
  
      input.value = ""; // Clear the input field
  
    } catch (error) {
      console.error("Error:", error);
      displayMessage("Folk Historian", "⚠️ I'm having trouble accessing the information. Please try again.", "bot");
    }
}
  
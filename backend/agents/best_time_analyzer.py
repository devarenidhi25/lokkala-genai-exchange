import os
import json
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
import google.generativeai as genai
from dotenv import load_dotenv
import requests

load_dotenv()

# Configure Gemini API
api_key = os.getenv("GOOGLE_API_KEY")
if not api_key:
    raise ValueError("GOOGLE_API_KEY not found in .env file!")

genai.configure(api_key=api_key)


class BestTimeAnalyzer:
    """
    Analyzes best time to post using:
    1. Instagram Graph API engagement data
    2. Gemini AI for seasonal/cultural insights
    3. Firestore historical data
    """
    
    def __init__(self):
        self.instagram_access_token = os.getenv("INSTAGRAM_ACCESS_TOKEN")
        self.instagram_business_account_id = os.getenv("INSTAGRAM_BUSINESS_ACCOUNT_ID")
        self.gemini_model = genai.GenerativeModel('gemini-2.0-flash-exp')
    
    def fetch_instagram_engagement(self, category: str, hashtags: List[str]) -> Dict[str, Any]:
        """
        Fetch engagement metrics from Instagram Graph API
        
        Returns engagement data including:
        - Peak posting times
        - Average likes/comments/shares
        - Best performing days
        """
        try:
            if not self.instagram_access_token or not self.instagram_business_account_id:
                return {
                    "peak_times": ["Friday-Sunday 7:00pm-10:00pm"],
                    "best_days": ["Friday", "Saturday", "Sunday"],
                    "avg_engagement_rate": 0.045,
                    "engagement_metrics": {
                        "avg_likes": 150,
                        "avg_comments": 25,
                        "avg_shares": 10,
                        "avg_saves": 35
                    },
                    "source": "default_estimate"
                }
            
            # Instagram Graph API endpoint for insights
            base_url = f"https://graph.facebook.com/v18.0/{self.instagram_business_account_id}"
            
            # Get recent media insights
            media_endpoint = f"{base_url}/media"
            media_params = {
                "fields": "id,caption,like_count,comments_count,timestamp,media_type,insights.metric(impressions,reach,saved)",
                "access_token": self.instagram_access_token,
                "limit": 50
            }
            
            response = requests.get(media_endpoint, params=media_params)
            
            if response.status_code != 200:
                raise Exception(f"Instagram API error: {response.text}")
            
            media_data = response.json().get("data", [])
            
            # Analyze engagement patterns
            engagement_by_hour = {}
            engagement_by_day = {}
            total_engagement = 0
            total_posts = len(media_data)
            
            for post in media_data:
                # Check if post matches category/hashtags
                caption = post.get("caption", "").lower()
                matches_category = any(tag.lower() in caption for tag in hashtags)
                
                if matches_category or not hashtags:
                    timestamp = datetime.fromisoformat(post.get("timestamp", "").replace("Z", "+00:00"))
                    hour = timestamp.hour
                    day = timestamp.strftime("%A")
                    
                    likes = post.get("like_count", 0)
                    comments = post.get("comments_count", 0)
                    
                    # Get insights if available
                    insights = post.get("insights", {}).get("data", [])
                    impressions = 0
                    reach = 0
                    saved = 0
                    
                    for insight in insights:
                        metric_name = insight.get("name")
                        value = insight.get("values", [{}])[0].get("value", 0)
                        
                        if metric_name == "impressions":
                            impressions = value
                        elif metric_name == "reach":
                            reach = value
                        elif metric_name == "saved":
                            saved = value
                    
                    engagement = likes + comments + saved
                    total_engagement += engagement
                    
                    # Track by hour
                    if hour not in engagement_by_hour:
                        engagement_by_hour[hour] = []
                    engagement_by_hour[hour].append(engagement)
                    
                    # Track by day
                    if day not in engagement_by_day:
                        engagement_by_day[day] = []
                    engagement_by_day[day].append(engagement)
            
            # Calculate averages
            avg_engagement_by_hour = {
                hour: sum(engagements) / len(engagements) 
                for hour, engagements in engagement_by_hour.items()
            }
            
            avg_engagement_by_day = {
                day: sum(engagements) / len(engagements) 
                for day, engagements in engagement_by_day.items()
            }
            
            # Find peak times (top 3 hours)
            sorted_hours = sorted(avg_engagement_by_hour.items(), key=lambda x: x[1], reverse=True)
            peak_hours = [f"{hour}:00-{hour+1}:00" for hour, _ in sorted_hours[:3]]
            
            # Find best days (top 3)
            sorted_days = sorted(avg_engagement_by_day.items(), key=lambda x: x[1], reverse=True)
            best_days = [day for day, _ in sorted_days[:3]]
            
            avg_engagement_rate = (total_engagement / total_posts) if total_posts > 0 else 0
            
            return {
                "peak_times": peak_hours,
                "best_days": best_days,
                "avg_engagement_rate": avg_engagement_rate / 1000,  # Normalize
                "engagement_metrics": {
                    "avg_likes": total_engagement / total_posts if total_posts > 0 else 0,
                    "avg_comments": sum(p.get("comments_count", 0) for p in media_data) / total_posts if total_posts > 0 else 0,
                    "total_posts_analyzed": total_posts
                },
                "source": "instagram_graph_api"
            }
            
        except Exception as e:
            print(f"Instagram API Error: {str(e)}")
            # Return default estimates if API fails
            return {
                "peak_times": ["18:00-19:00", "19:00-20:00", "20:00-21:00"],
                "best_days": ["Friday", "Saturday", "Sunday"],
                "avg_engagement_rate": 0.045,
                "engagement_metrics": {
                    "avg_likes": 150,
                    "avg_comments": 25,
                    "error": str(e)
                },
                "source": "fallback_estimate"
            }
    
    def analyze_with_gemini(self, product_name: str, category: str, keywords: List[str]) -> Dict[str, Any]:
        """
        Use Gemini AI to analyze seasonal trends, cultural relevance, and regional demand
        """
        try:
            prompt = f"""You are a market intelligence expert analyzing product demand in India.

Product: {product_name}
Category: {category}
Keywords: {', '.join(keywords)}

Analyze the following:
1. **Seasonal Demand**: Which months/seasons have highest demand? Consider Indian festivals, weather, cultural events.
2. **Regional Preferences**: Which Indian states would be most interested? Why?
3. **Festival Connection**: Which festivals boost this product's demand?
4. **Best Posting Days**: Which days of the week are best for marketing this product?
5. **Optimal Posting Time**: What time windows (morning/afternoon/evening) work best?
6. **Target Audience Behavior**: When is the target audience most active on social media?

Provide your analysis in JSON format:
{{
  "season_spike": ["festival_name or month"],
  "best_months": ["month1", "month2"],
  "target_states": ["state1", "state2", "state3"],
  "festivals": ["festival1", "festival2"],
  "best_days": ["day1", "day2", "day3"],
  "best_time_slots": ["time_range1", "time_range2"],
  "reasoning": "detailed explanation",
  "expected_demand_boost": "percentage or description",
  "cultural_insights": "key cultural factors"
}}

Only respond with valid JSON."""

            response = self.gemini_model.generate_content(prompt)
            response_text = response.text.strip()
            
            # Extract JSON from response
            if "```json" in response_text:
                response_text = response_text.split("```json")[1].split("```")[0].strip()
            elif "```" in response_text:
                response_text = response_text.split("```")[1].split("```")[0].strip()
            
            gemini_analysis = json.loads(response_text)
            return gemini_analysis
            
        except Exception as e:
            print(f"Gemini API Error: {str(e)}")
            # Return default analysis if Gemini fails
            return {
                "season_spike": ["Diwali", "Holi"],
                "best_months": ["October", "November", "March"],
                "target_states": ["Maharashtra", "Gujarat", "Rajasthan"],
                "festivals": ["Diwali", "Ganesh Chaturthi"],
                "best_days": ["Friday", "Saturday", "Sunday"],
                "best_time_slots": ["6:00pm-9:00pm", "11:00am-1:00pm"],
                "reasoning": f"Traditional/artisan products like {category} typically see demand during festival seasons.",
                "expected_demand_boost": "+50-70%",
                "cultural_insights": "Cultural products align with festival preparations and gifting seasons",
                "error": str(e)
            }
    
    def fetch_firestore_history(self, category: str) -> Dict[str, Any]:
        """
        Fetch historical performance data from Firestore
        NOTE: You'll need to implement actual Firestore connection
        """
        try:
            # TODO: Implement Firestore connection
            # from google.cloud import firestore
            # db = firestore.Client()
            # query historical posts, views, engagement
            
            # For now, return mock data
            return {
                "past_performance": {
                    "avg_views": 250,
                    "avg_engagement": 45,
                    "best_performing_times": ["19:00-21:00"],
                    "best_performing_days": ["Saturday", "Sunday"]
                },
                "historical_posts": 0,
                "source": "mock_data"
            }
            
        except Exception as e:
            print(f"Firestore Error: {str(e)}")
            return {
                "past_performance": {},
                "error": str(e)
            }
    
    def compute_best_time(
        self, 
        insta_data: Dict[str, Any], 
        gemini_data: Dict[str, Any], 
        firestore_data: Dict[str, Any],
        product_name: str,
        category: str
    ) -> Dict[str, Any]:
        """
        Combine all data sources with weighted algorithm:
        - Instagram engagement: 50%
        - Gemini cultural/seasonal insights: 30%
        - Firestore historical data: 20%
        """
        try:
            # Extract best times from each source
            insta_peak_times = insta_data.get("peak_times", [])
            insta_best_days = insta_data.get("best_days", [])
            
            gemini_time_slots = gemini_data.get("best_time_slots", [])
            gemini_best_days = gemini_data.get("best_days", [])
            
            firestore_times = firestore_data.get("past_performance", {}).get("best_performing_times", [])
            firestore_days = firestore_data.get("past_performance", {}).get("best_performing_days", [])
            
            # Combine days with weighted scoring
            day_scores = {}
            all_days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
            
            for day in all_days:
                score = 0
                if day in insta_best_days:
                    score += 50
                if day in gemini_best_days:
                    score += 30
                if day in firestore_days:
                    score += 20
                day_scores[day] = score
            
            # Get top 3 days
            sorted_days = sorted(day_scores.items(), key=lambda x: x[1], reverse=True)
            best_days = [day for day, score in sorted_days if score > 0][:3]
            
            # Combine time slots and remove duplicates
            all_time_slots = insta_peak_times + gemini_time_slots + firestore_times
            time_slots = list(dict.fromkeys(all_time_slots))  # Remove duplicates while preserving order
            
            # Format best time string (single, clean output)
            if best_days:
                days_str = ", ".join(best_days[:2]) if len(best_days) >= 2 else best_days[0]
            else:
                days_str = "Friday-Sunday"
            
            if time_slots:
                time_str = time_slots[0]
            else:
                time_str = "7:00pm-10:00pm"
            
            best_time_to_post = f"{days_str} | {time_str}"
            
            # Calculate expected engagement improvement
            base_engagement = insta_data.get("avg_engagement_rate", 0.045)
            gemini_boost = gemini_data.get("expected_demand_boost", "+50%")
            
            # Extract percentage from gemini boost
            try:
                boost_percentage = int(''.join(filter(str.isdigit, gemini_boost.split('-')[0])))
            except:
                boost_percentage = 50
            
            expected_improvement = f"+{boost_percentage}%"
            
            # Remove duplicates from arrays
            target_regions = list(dict.fromkeys(gemini_data.get("target_states", ["Maharashtra", "Gujarat"])))
            season_spikes = list(dict.fromkeys(gemini_data.get("season_spike", [])))
            festivals = list(dict.fromkeys(gemini_data.get("festivals", [])))
            
            # Build CLEAN final response - Single values only, no detailed_analysis
            result = {
                "product": product_name,
                "category": category,
                "target_region": target_regions,
                "best_time_to_post": best_time_to_post,
                "season_spike": season_spikes,
                "festivals": festivals,
                "reasoning": gemini_data.get("reasoning", ""),
                "expected_engagement_improvement": expected_improvement
            }
            
            return result
            
        except Exception as e:
            print(f"Computation Error: {str(e)}")
            return {
                "error": str(e),
                "product": product_name,
                "category": category
            }
    
    def analyze(
        self, 
        product_name: str, 
        category: str, 
        keywords: List[str],
        hashtags: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Main analysis function - combines all data sources
        """
        if hashtags is None:
            hashtags = keywords
        
        # Fetch data from all sources
        print(f"Analyzing best time to post for: {product_name}")
        
        print("1. Fetching Instagram engagement data...")
        insta_data = self.fetch_instagram_engagement(category, hashtags)
        
        print("2. Analyzing with Gemini AI...")
        gemini_data = self.analyze_with_gemini(product_name, category, keywords)
        
        print("3. Fetching Firestore historical data...")
        firestore_data = self.fetch_firestore_history(category)
        
        print("4. Computing best time recommendation...")
        result = self.compute_best_time(insta_data, gemini_data, firestore_data, product_name, category)
        
        return result
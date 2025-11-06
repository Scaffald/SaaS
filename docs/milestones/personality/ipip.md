# IPIP Personality Assessment Feature - Product Requirements Document (PRD)

## Overview  
The IPIP (International Personality Item Pool) personality assessment feature provides users with a scientifically validated measure of the Big Five personality traits. This feature enables users to complete a series of items, receive scored results across domains and facets, and view personalized narrative content that interprets their unique personality profile.

## Goals  
- Deliver an engaging, user-friendly IPIP personality assessment experience.  
- Accurately score user responses to produce Big Five domain and facet results.  
- Present results in both narrative and visual chart formats.  
- Integrate with existing data sources and user progression systems.  
- Encourage continued engagement through gamification elements such as XP and Scaffald Score.

## Data Model  
- **Items**: Questions from the IPIP item pool, each associated with a facet and domain.  
- **Responses**: User selections captured on a Likert scale (e.g., 1-5).  
- **Scores**: Calculated by aggregating responses per facet and domain, normalized as percentages.  
- **Narrative Text**: Pulled from `en.results.json` based on score ranges (low, neutral, high) for each domain and facet.  
- **Mappings**:  
  - Low: scores below a defined threshold mapped to "low" narrative text.  
  - Neutral: scores within a middle range mapped to "neutral" narrative text.  
  - High: scores above a defined threshold mapped to "high" narrative text.

## User Flow  
1. **Introduction**: Brief explanation of the IPIP assessment and estimated completion time.  
2. **Assessment**: Users answer a series of items with progress indicated via a progress bar.  
3. **Submission**: Responses are submitted and scored immediately.  
4. **Results Page**: Users view their results in two tabs: Narrative and Chart.  
5. **Gamification**: XP and Scaffald Score updates based on completion and results shared.

## Results Page  

### Narrative View  
- Displays personalized narrative content for each Big Five domain and its facets.  
- Narrative text is selected based on the user’s score mapped to low, neutral, or high categories from `en.results.json`.  
- Each domain section includes:  
  - Domain name and brief description.  
  - Facet-level narratives with detailed interpretations.  
- Option to expand/collapse facet details for readability.

### Chart View  
- Features a radar chart visualizing the Big Five domain scores as percentages.  
- Includes an interactive list of facets with their individual scores displayed as progress bars.  
- Hover or tap on facets reveals additional narrative insights.  
- Clear labeling and color coding for low, neutral, and high score ranges.

## Integration Points  
- **Data Source**: Utilize `en.results.json` for narrative text content.  
- **User Profile**: Store assessment completion status and scores in user profiles.  
- **Gamification System**: Update XP and Scaffald Score upon assessment completion.  
- **UI Components**: Reuse existing progress bar and radar chart components for consistency.

## Success Metrics  
- Completion rate of IPIP assessment.  
- User engagement with results page (time spent, interactions with narrative and chart views).  
- Increase in user XP and Scaffald Score post-assessment.  
- Positive user feedback on clarity and usefulness of narrative content.  
- Reduction in drop-off rates during assessment progression.

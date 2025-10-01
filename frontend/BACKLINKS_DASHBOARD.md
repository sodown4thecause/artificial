# Backlinks Dashboard

A comprehensive backlinks analysis dashboard built with React and shadcn/ui components.

## Features

### 📊 Overview Statistics
- **Total Backlinks**: Complete count with visual display
- **New Backlinks**: Tracking newly discovered links
- **Lost Backlinks**: Monitoring removed or broken links
- **Average Spam Score**: Quality assessment metric
- **DoFollow Links**: Count of valuable SEO links

### 🔍 Search & Analysis
- Real-time URL analysis via Make.com webhook
- Direct integration with DataForSEO API
- No authentication required (bypasses Clerk/Supabase issues)

### 📈 Data Views

#### All Tab
- Comprehensive table view with sortable columns
- Shows: Source domain, anchor text, link type, rank, spam score, status, last seen date
- Click-through to source URLs
- Visual badges for quick quality assessment

#### Details Tab
- Card-based detailed view
- Individual backlink information:
  - Anchor text
  - Link type (canonical, redirect, anchor, image)
  - Domain rank
  - Country information
  - First/last seen dates
  - Spam score analysis

#### Metrics Tab
- **Link Type Distribution**: Visual breakdown of backlink types
- **Top Referring Domains**: Most common sources
- Progress bars for visual analysis

### 🎨 Filtering & Sorting

**Filters:**
- All Links
- DoFollow only
- NoFollow only
- New links
- Lost links
- Clean (no spam) links

**Sort Options:**
- By Rank (highest first)
- By Spam Score (lowest first)
- By Date (most recent first)

### 💾 Export
- CSV export functionality
- Includes all visible filtered data
- Formatted for Excel/Google Sheets

## Technical Stack

- **React** with TypeScript
- **shadcn/ui** components:
  - Card, Table, Tabs, Badge, Button
  - Input, Select, Skeleton
  - Dialog (for future features)
- **Lucide React** icons
- **Tailwind CSS** for styling

## API Integration

### Webhook URL
```
https://hook.us2.make.com/vo0wugr8juix9untkitdyfpdfbic8ba5
```

### Request Format
```json
{
  "url": "https://example.com"
}
```

### Response Structure
Returns DataForSEO backlinks API format with:
- Total count
- Items array with detailed backlink data
- Each item includes 50+ data points

## Usage

### Accessing the Dashboard
Navigate to: `/dashboard/backlinks`

### Analyzing a URL
1. Enter any URL in the search box
2. Click "Analyze" or press Enter
3. Wait for results (typically 5-30 seconds)
4. Explore data using tabs and filters

### Understanding Badges

**Spam Score:**
- 🟢 Clean (0)
- 🔵 Low (1-15)
- 🟡 Medium (16-35)
- 🔴 High (36+)

**Rank:**
- 🟢 High Authority (500+)
- 🔵 Good (300-499)
- 🟡 Medium (100-299)
- ⚪ Low (<100)

**Status:**
- 🟢 New: Recently discovered
- 🔴 Lost: No longer detected
- ⚪ Active: Stable link

## Component Structure

```
BacklinksDashboard.tsx
├── Search Section (Card)
├── Stats Cards (4 cards)
├── Tabs Container
│   ├── All Tab (Table)
│   ├── Details Tab (Card Grid)
│   └── Metrics Tab (Charts)
└── Export Button
```

## Future Enhancements

- [ ] Historical tracking (save searches)
- [ ] Alerts for new/lost backlinks
- [ ] Competitor comparison
- [ ] Automated monitoring
- [ ] Bulk URL analysis
- [ ] Custom spam score thresholds
- [ ] Link velocity charts
- [ ] Domain authority trends

## Development

### Adding New Filters
1. Add filter option to `filterType` state
2. Update Select component options
3. Implement filter logic in `filterAndSortBacklinks`

### Adding New Metrics
1. Calculate metric from `backlinks` array
2. Create new Card component
3. Add to Metrics tab

### Styling Customization
All components use Tailwind CSS and shadcn/ui design tokens:
- `primary`: Main brand color
- `secondary`: Secondary elements
- `muted`: Subtle backgrounds
- `destructive`: Errors/warnings
- `success`: Positive indicators

## Troubleshooting

### Webhook Returns 404
- Ensure Make.com scenario is running
- Check webhook URL is correct
- Verify scenario is in "listening" mode

### No Data Displayed
- Check browser console for errors
- Verify API response structure
- Ensure `tasks[0].result[0].items` exists

### Performance Issues
- Limit displayed results (currently showing 100)
- Implement pagination for large datasets
- Use virtual scrolling for tables

## Related Files

- `/src/types/backlinks.ts` - TypeScript definitions
- `/src/pages/dashboard/BacklinksDashboard.tsx` - Main component
- `/src/components/ui/*` - shadcn/ui components

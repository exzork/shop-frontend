# Anonymous Email Notification System for Game Account Buyers

This system allows potential buyers to subscribe to email notifications when game accounts with specific criteria become available, without requiring registration or authentication.

## 🌟 Key Features

### ✅ **100% Anonymous**
- No registration or account creation required
- Only email address is collected
- No personal information stored
- Privacy-first approach

### ✅ **Easy Unsubscribe**
- Every email includes a unique unsubscribe link
- One-click unsubscribe with secure tokens
- GDPR compliant
- Dedicated unsubscribe page with status feedback

### ✅ **Smart Matching**
- Character constellation filtering (C0, C1, C2, etc.)
- Weapon filtering by name
- Server-specific notifications
- Price range filtering
- Game-specific subscriptions

### ✅ **Beautiful Email Templates**
- Professional HTML email design
- Account details with images
- Character and weapon information
- Clear call-to-action buttons

## 🚀 Frontend Pages & Components

### **Pages Available:**

#### 1. **Notifications Management** (`/notifications`)
- Full subscription management interface
- Create, edit, and delete subscriptions
- View all active subscriptions
- Email validation and storage

#### 2. **Unsubscribe Page** (`/unsubscribe?token=...`)
- Handles unsubscribe requests from email links
- Real-time status feedback (loading, success, error, invalid)
- User-friendly error messages
- Automatic token processing

#### 3. **Integrated Notifications** (Account Search Pages)
- `NoAccountsNotification` component appears when no search results found
- Automatically creates subscriptions based on current search criteria
- One-click notification setup

### **Components:**

#### **`NoAccountsNotification` Component**
- Appears when no search results found
- Shows current search criteria summary
- Email input with validation
- Creates subscriptions from search filters
- Integrates seamlessly into existing account search pages

#### **`BuyerNotifications` Component**
- Complete subscription management interface
- Email validation and localStorage management
- Create, edit, delete subscriptions
- Real-time subscription status
- Professional UI with dark mode support

#### **`UnsubscribePage` Component**
- Handles unsubscribe links from emails
- Processes unsubscribe tokens automatically
- Shows loading, success, error, and invalid states
- User-friendly messaging and navigation

## 🎯 Frontend Routes

```typescript
// Public routes (no authentication required)
/notifications          // Subscription management page
/unsubscribe            // Unsubscribe from email notifications
/games/:gameId          // Account search (includes NoAccountsNotification)

// Email unsubscribe link format
/unsubscribe?token=abc123xyz...
```

## 🔧 Frontend Integration

### 1. Import the Email Notification Service

```typescript
import {
  isValidEmail,
  getUserEmail,
  setUserEmail,
  hasNotificationsEnabled,
  showNotificationMessage,
  useCreateEmailNotificationSubscriptionMutation,
  useGetEmailNotificationSubscriptionsQuery,
  useUpdateEmailNotificationSubscriptionMutation,
  useDeleteEmailNotificationSubscriptionMutation,
  useLazyUnsubscribeFromNotificationsQuery
} from '../services/emailNotifications';
```

### 2. Basic Usage Example

```typescript
function AccountNotificationComponent() {
  const [userEmail, setUserEmailState] = useState('');
  const [createSubscription] = useCreateEmailNotificationSubscriptionMutation();
  
  const handleSubscribe = async () => {
    if (!isValidEmail(userEmail)) {
      showNotificationMessage('Please enter a valid email', 'error');
      return;
    }
    
    setUserEmail(userEmail); // Save to localStorage
    
    await createSubscription({
      email: userEmail,
      game_id: 1,
      server_name: 'America',
      gender: 'Male',
      max_price: 100,
      characters: [
        { character: 'Zhongli', min_copies: 1 }
      ],
      weapons: [
        { weapon: 'Staff of Homa', min_copies: 0 }
      ]
    });
  };
  
  return (
    <div>
      <input 
        type="email" 
        value={userEmail}
        onChange={(e) => setUserEmailState(e.target.value)}
        placeholder="Enter your email"
      />
      <button onClick={handleSubscribe}>Subscribe</button>
    </div>
  );
}
```

### 3. Unsubscribe Implementation

```typescript
function UnsubscribeComponent() {
  const [searchParams] = useSearchParams();
  const [triggerUnsubscribe] = useLazyUnsubscribeFromNotificationsQuery();
  const [status, setStatus] = useState('loading');
  
  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      triggerUnsubscribe({ token })
        .then(result => {
          if (result.data?.success) {
            setStatus('success');
          } else {
            setStatus('error');
          }
        })
        .catch(() => setStatus('error'));
    }
  }, []);
  
  return (
    <div>
      {status === 'loading' && <p>Processing unsubscribe...</p>}
      {status === 'success' && <p>Successfully unsubscribed!</p>}
      {status === 'error' && <p>Failed to unsubscribe.</p>}
    </div>
  );
}
```

## 🎯 API Endpoints

The backend provides these endpoints:

### Create Subscription
```
POST /buyer-notifications/subscriptions
Content-Type: application/json

{
  "email": "buyer@example.com",
  "game_id": 1,
  "server_name": "America",
  "gender": "Male",
  "max_price": 200.00,
  "characters": [
    {
      "character": "Venti",
      "min_copies": 0  // C0+ (any constellation)
    },
    {
      "character": "Diluc", 
      "min_copies": 1  // C1+ (constellation 1 or higher)
    }
  ],
  "weapons": [
    {
      "weapon": "Skyward Harp",
      "min_copies": 0  // R1+ (any refinement)
    },
    {
      "weapon": "Staff of Homa",
      "min_copies": 1  // R2+ (refinement 2 or higher)
    }
  ]
}
```

### Get Subscriptions
```
GET /buyer-notifications/subscriptions?email=buyer@example.com
```

### Update Subscription
```
PUT /buyer-notifications/subscriptions/{id}
Content-Type: application/json

{
  "email": "buyer@example.com",
  "game_id": 1,
  "is_active": true,
  // ... other fields
}
```

### Delete Subscription
```
DELETE /buyer-notifications/subscriptions/{id}?email=buyer@example.com
```

### Unsubscribe (Frontend calls this automatically)
```
GET /buyer-notifications/unsubscribe?token={unique_token}
```

## 🔐 Security & Privacy

### Email Validation
- Frontend validates email format
- Backend performs additional validation
- Invalid emails are rejected

### Unsubscribe Tokens
- Each subscription has a unique unsubscribe token
- Tokens are cryptographically secure
- One-click unsubscribe without authentication
- Frontend automatically processes tokens from email links

### Data Minimization
- Only necessary data is collected
- No tracking or analytics
- Automatic cleanup of inactive subscriptions

## 📧 Email Template Features

### Professional Design
- Modern, responsive HTML layout
- Dark/light theme compatible
- Mobile-friendly design

### Complete Account Information
- Account images and details
- Character constellation information
- Weapon details and levels
- Server and price information

### Clear Call-to-Action
- Direct link to account page
- "Buy Now" button
- Account code and details

### Compliance Footer
- Easy unsubscribe link pointing to `/unsubscribe?token=...`
- Privacy information
- Contact details

## 🛠️ Development Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Backend
Ensure your Go backend has the email notification endpoints implemented and email service configured.

### 3. Update API Configuration
Make sure the `src/services/api.ts` file points to your backend URL.

### 4. Test the System
1. Open your React app
2. Navigate to `/notifications` or search for accounts with no results
3. Enter your email in the notification prompt
4. Create a subscription
5. Verify the subscription was created
6. Test unsubscribe by visiting `/unsubscribe?token=test`

## 🚀 Deployment Considerations

### Email Service Configuration
- Ensure your backend has proper SMTP configuration
- Test email delivery in your environment
- Configure proper email templates with correct unsubscribe links

### Frontend Routes
- Ensure `/notifications` and `/unsubscribe` routes are accessible
- Configure proper error handling for invalid tokens
- Test unsubscribe flow from actual emails

### Database Performance
- Index email columns for fast queries
- Implement proper cleanup for old subscriptions
- Monitor subscription volume

### Rate Limiting
- Implement rate limiting for subscription creation
- Prevent spam email addresses
- Monitor for abuse

## 📊 Analytics & Monitoring

### Key Metrics to Track
- Subscription creation rate
- Email open/click rates
- Unsubscribe rates
- Matching accuracy
- Unsubscribe page visits

### Logging
- Log subscription creations/deletions
- Track email sending success/failures
- Monitor unsubscribe events
- Track invalid unsubscribe attempts

## 🔧 Customization

### Email Templates
The system sends beautiful HTML emails with unsubscribe links. You can customize:
- Email styling and branding
- Account information display
- Call-to-action buttons
- Footer information with unsubscribe links

### Unsubscribe Experience
- Customize unsubscribe page styling
- Add custom messaging for different scenarios
- Implement additional confirmation steps if needed
- Add feedback collection for unsubscribes

### Matching Logic
The backend implements smart matching:
- Characters: Subscribers get notified for equal or higher constellations
- Weapons: Exact name matching
- Servers: Exact server matching or "any server"
- Price: Accounts at or below max price

### Notification Frequency
- Real-time notifications when accounts are added
- No spam or duplicate notifications
- Smart deduplication

## 🎉 User Experience

### Seamless Integration
- Appears automatically when no results found
- One-click setup with email only
- Intelligent subscription creation from search criteria

### Privacy Focused
- No tracking or cookies
- Minimal data collection
- Easy unsubscribe process with immediate feedback

### Mobile Friendly
- Responsive design
- Touch-friendly interface
- Fast loading times
- Works on all devices and email clients

### Complete Flow
1. **Search for accounts** → No results found
2. **Enter email** → Enable notifications  
3. **Create subscription** → Based on search criteria
4. **Receive emails** → When matching accounts are found
5. **Easy unsubscribe** → One-click via unique tokens with immediate feedback

---

**🎮 Happy Account Hunting!** The email notification system ensures buyers never miss their perfect game accounts while maintaining complete privacy and anonymity with a seamless unsubscribe experience. 
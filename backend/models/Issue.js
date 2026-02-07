import mongoose from 'mongoose'

const issueSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['pothole', 'garbage', 'streetlight', 'traffic-signal', 'parks', 'sidewalk', 'other']
  },
  status: {
    type: String,
    enum: ['reported', 'acknowledged', 'in-progress', 'resolved'],
    default: 'reported'
  },
  location: {
    address: {
      type: String,
      required: true
    },
    coordinates: {
      lat: {
        type: Number,
        required: true
      },
      lng: {
        type: Number,
        required: true
      }
    }
  },
  images: [String],
  reporter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  upvotes: {
    type: Number,
    default: 0
  },
  upvotedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    text: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
})

// Create sample data
issueSchema.statics.createSampleData = async function(User) {
  try {
    const count = await this.countDocuments()
    if (count === 0) {
      console.log('🔄 Creating sample issues...')
      
      // Find any user to associate with sample issues
      const anyUser = await User.findOne()
      
      if (anyUser) {
        const sampleIssues = [
          {
            title: 'Large pothole on Main Street',
            description: 'There is a large pothole that needs immediate attention. It\'s causing traffic issues and vehicle damage.',
            category: 'pothole',
            status: 'reported',
            location: {
              address: '123 Main Street, Nairobi',
              coordinates: { lat: -1.2921, lng: 36.8219 }
            },
            images: [],
            reporter: anyUser._id,
            upvotes: 5,
            upvotedBy: []
          },
          {
            title: 'Broken streetlight near Central Park',
            description: 'Streetlight has been out for 3 days, making the area unsafe at night for pedestrians.',
            category: 'streetlight',
            status: 'in-progress',
            location: {
              address: '456 Central Park Road, Nairobi',
              coordinates: { lat: -1.2833, lng: 36.8167 }
            },
            images: [],
            reporter: anyUser._id,
            upvotes: 12,
            upvotedBy: []
          },
          {
            title: 'Garbage accumulation in downtown alley',
            description: 'Trash has been piling up for over a week. Creating bad odor and attracting pests.',
            category: 'garbage',
            status: 'acknowledged',
            location: {
              address: '789 Downtown Alley, Nairobi',
              coordinates: { lat: -1.2863, lng: 36.8172 }
            },
            images: [],
            reporter: anyUser._id,
            upvotes: 8,
            upvotedBy: []
          },
          {
            title: 'Damaged sidewalk near shopping mall',
            description: 'Sidewalk tiles are broken and uneven, creating tripping hazard for pedestrians.',
            category: 'sidewalk',
            status: 'resolved',
            location: {
              address: '321 Mall Road, Nairobi',
              coordinates: { lat: -1.2881, lng: 36.8235 }
            },
            images: [],
            reporter: anyUser._id,
            upvotes: 15,
            upvotedBy: []
          }
        ]

        await this.insertMany(sampleIssues)
        console.log(`✅ ${sampleIssues.length} sample issues created successfully`)
      } else {
        console.log('ℹ️ No users found to associate with sample issues')
      }
    } else {
      console.log(`✅ Database already has ${count} issues`)
    }
  } catch (error) {
    console.error('❌ Error creating sample issues:', error.message)
  }
}

export default mongoose.model('Issue', issueSchema)



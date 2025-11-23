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
  const count = await this.countDocuments()
  if (count === 0) {
    const adminUser = await User.findOne({ email: 'adminvoiceit@gmail.com' })
    const sampleUser = await User.findOne({ email: { $ne: 'adminvoiceit@gmail.com' } })
    
    const reporter = sampleUser || adminUser

    if (reporter) {
      const sampleIssues = [
        {
          title: 'Large pothole on Main Street',
          description: 'There is a large pothole that needs immediate attention. It\'s causing traffic issues and vehicle damage.',
          category: 'pothole',
          status: 'reported',
          location: {
            address: '123 Main Street, City Center',
            coordinates: { lat: 40.7128, lng: -74.0060 }
          },
          images: [],
          reporter: reporter._id,
          upvotes: 5,
          upvotedBy: []
        },
        {
          title: 'Broken streetlight near park',
          description: 'Streetlight has been out for 3 days, making the area unsafe at night for pedestrians.',
          category: 'streetlight',
          status: 'in-progress',
          location: {
            address: '456 Park Avenue, Downtown',
            coordinates: { lat: 40.7282, lng: -74.0776 }
          },
          images: [],
          reporter: reporter._id,
          upvotes: 12,
          upvotedBy: []
        },
        {
          title: 'Garbage accumulation in alley',
          description: 'Trash has been piling up for over a week. Creating bad odor and attracting pests.',
          category: 'garbage',
          status: 'acknowledged',
          location: {
            address: '789 Oak Lane, Residential Area',
            coordinates: { lat: 40.7505, lng: -73.9934 }
          },
          images: [],
          reporter: reporter._id,
          upvotes: 8,
          upvotedBy: []
        }
      ]

      await this.insertMany(sampleIssues)
      console.log('✅ Sample issues created successfully')
    }
  }
}

export default mongoose.model('Issue', issueSchema)
const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review cannot be empty'],
      maxlength: [
        500,
        'Review exceeds limit. A maximum review length is 500 characters',
      ],
    },
    rating: {
      type: Number,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0'],
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a tour'],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user'],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

reviewSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'user',
    select: 'name photo',
  });
  next();
});

// Static method can be used on the Model, not the doc. the this keyword points to the current model
reviewSchema.statics.calcAverageRatings = async function (tourId) {
  const stats = await this.aggregate([
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);

  await Tour.findByIdAndUpdate(tourId, {
    ratingsQuantity: stats.length > 0 ? stats[0].nRating : 0,
    ratingsAverage: stats.length > 0 ? stats[0].avgRating : 4.5,
  });
};

reviewSchema.post('save', function () {
  // this keyword points to current document, this.constructor points to the Model created the document
  this.constructor.calcAverageRatings(this.tour);
});

reviewSchema.pre(/^findOneAnd/, async function (next) {
  // this keyword is current Query
  this.review = await this.findOne();
  next();
});

reviewSchema.post(/^findOneAnd/, async function () {
  // await this.findOne(); does not work here b/c query already executed
  await this.review.constructor.calcAverageRatings(this.review.tour);
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;

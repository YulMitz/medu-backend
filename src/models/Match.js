const mongoose = require('mongoose');

const MatchSchema = new mongoose.Schema({
    userAId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },

    userBId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },

    matchStatus: {
        userAtoBstatus : {type: String, enum: ['dislike', 'like', 'pending']},
        userBtoAstatus : {type: String, enum: ['dislike', 'like', 'pending']}
    }

}, { timestamps: true });

module.exports = mongoose.model('Match', MatchSchema);
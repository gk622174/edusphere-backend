const Tag = require("../models/tag");

exports.createTags = async (req, res) => {
  try {
    // 1. Fetching Data From Req Body
    const { name, description } = req.body;
    // 2. validation
    if (!name || !description) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // 3. Check Tag Is Already In DB
    const tags = await Tag.findOne({ name: name });
    if (tags) {
      return res.status(400).json({
        success: false,
        message: "This tag already exist in DB",
      });
    }

    // 4. Create Tag
    await Tag.create({ name: name, description: description });

    res.status(200).json({
      success: false,
      message: "Tags created successfully ",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get all tags

exports.showAllTags = async (req, res) => {
  try {
    // Call DB To Fetch All Tags
    const allTags = await Tag.find({}, { name: true, description: true });
    res.status(200).json({
      success: true,
      message: "Fetch all tags",
      allTags,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const categories = [
    { id: 10, name: 'Main Dish' },
    { id : 11, name: 'Side Dish'},
    { id: 12, name:'Salad' },
    { id: 13, name: 'Soup' },
    { id: 14, name: 'Noodle' },
    { id: 15, name: 'Grilled or Roasted'},
    { id: 16, name: 'Fried' },
    { id: 17, name: 'Dessert' },
    { id: 18, name: 'Snack' },
    { id: 19, name: 'Bread' },
];

const cuisines = [
    { id: 30, name: 'American'  },
    { id: 31, name: 'Japanese'  },
    { id: 32, name: 'Korean'    },
    { id: 33, name: 'Chinese'   },
    { id: 34, name: 'Indian'    },
    { id: 35, name: 'Vietnamese'},
    { id: 36, name: 'Italian'   },
    { id: 37, name: 'French'    },
    { id: 38, name: 'Mexican'   },
    { id: 39, name: 'Spanish'   },
    { id: 40, name: 'Thai'      },
    { id: 41, name: 'Greek'     },
    { id: 42, name: 'Turkish'   },
    { id: 43, name: 'Russian'   },
    { id: 44, name: 'German'    },
    { id: 45, name: 'Brazilian' },
    { id: 46, name: 'Middle Eastern'},
    { id: 47, name: 'African'   },
    { id: 48, name: 'Britsh'    },
];

const dietaryRestrictions = [
    {
        id: 60,
        name: 'Vegetarian',
        description: 'A diet that excludes animal meat, generally including\
                    vegetables, fruits, grains, and nuts. Dairy and eggs are\
                    usually allowed.',
    },
    {
        id: 61,
        name: 'Vegan',
        description: 'A diet that excludes all animal products.',
    },
    {
        id: 62,
        name: 'Gluten-Free',
        description: 'A diet excluding foods containing gluten, such as wheat, barley, and rye.',
    },
    {
        id: 63,
        name: 'Lacto-Ovo Vegetarian',
        description: 'A vegetarian diet that includes dairy and eggs but excludes meat.',
    },
    {
        id: 64,
        name: 'Lacto Vegetarian',
        description: 'A vegetarian diet that includes dairy but excludes eggs and meat.',
    },
    {
        id: 65,
        name: 'Ovo Vegetarian',
        description: 'A vegetarian diet that includes eggs but excludes dairy and meat.',
    },
    {
        id: 66,
        name: 'Low-Calorie',
        description: 'A diet focused on reducing calorie intake, often including low-fat and low-carb foods.',
    },
    {
        id: 67,
        name: 'Low-Fat',
        description: 'A diet that reduces fat intake, including lean proteins and vegetables instead of high-fat foods.',
    },
    {
        id: 68,
        name: 'Low-Carb',
        description: 'A diet that reduces carbohydrate intake, often emphasizing protein and healthy fats.',
    },
    {
        id: 69,
        name: 'High-Protein',
        description: 'A diet high in protein, which can be beneficial for athletes or individuals building muscle.',
    },
    {
        id: 70,
        name: 'Kosher',
        description: 'A diet following Jewish dietary laws, avoiding specific animals and the mixing of meat and dairy.',
    },
    {
        id: 71,
        name: 'Halal',
        description: 'A diet that follows Islamic dietary laws, avoiding prohibited items like pork and alcohol.',
    },
    {
        id: 72,
        name: 'Lactose-Free',
        description: 'A diet for individuals who are lactose-intolerant, excluding lactose-containing dairy products.',
    },
    {
        id: 73,
        name: 'Nut-Free',
        description: 'A diet excluding all types of nuts for individuals with nut allergies.',
    },
    {
        id: 74,
        name: 'Low-Sodium',
        description: 'A diet that reduces sodium intake, beneficial for hypertension or heart disease prevention.',
    },
];

export { categories, cuisines, dietaryRestrictions };
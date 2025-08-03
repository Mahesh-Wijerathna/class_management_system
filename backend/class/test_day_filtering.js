// Test script to demonstrate day-based filtering
const testClasses = [
  {
    id: 126,
    className: "No Grace Period Test Class",
    schedule: {
      day: "Monday",
      startTime: "00:00:00",
      endTime: "00:00:00",
      frequency: "weekly"
    }
  },
  {
    id: 129,
    className: "Monthly Test Class",
    schedule: {
      day: "Saturday",
      startTime: "10:00:00",
      endTime: "12:00:00",
      frequency: "monthly"
    }
  },
  {
    id: 127,
    className: "sfsfs",
    schedule: {
      day: null,
      startTime: null,
      endTime: null,
      frequency: "no-schedule"
    }
  },
  {
    id: 130,
    className: "Test No Schedule Class",
    schedule: {
      day: null,
      startTime: null,
      endTime: null,
      frequency: "no-schedule"
    }
  }
];

// Simulate different days
const simulateDay = (dayName) => {
  console.log(`\n=== Testing for ${dayName} ===`);
  
  // Today's Classes filter
  const todaysClasses = testClasses.filter(c => {
    if (!c.schedule || c.schedule.frequency === 'no-schedule') return false;
    return c.schedule.day === dayName;
  });
  
  console.log(`Today's Classes (${dayName}):`);
  todaysClasses.forEach(c => {
    console.log(`  - ${c.className} (${c.schedule.frequency})`);
  });
  
  // This Week filter
  const thisWeekClasses = testClasses.filter(c => {
    if (!c.schedule || c.schedule.frequency === 'no-schedule') return false;
    return c.schedule.day === dayName || c.schedule.frequency === 'weekly';
  });
  
  console.log(`\nThis Week's Classes (${dayName}):`);
  thisWeekClasses.forEach(c => {
    console.log(`  - ${c.className} (${c.schedule.frequency})`);
  });
  
  // This Month filter
  const thisMonthClasses = testClasses.filter(c => {
    if (!c.schedule || c.schedule.frequency === 'no-schedule') return false;
    return c.schedule.frequency === 'weekly' || c.schedule.frequency === 'bi-weekly' || c.schedule.frequency === 'monthly';
  });
  
  console.log(`\nThis Month's Classes:`);
  thisMonthClasses.forEach(c => {
    console.log(`  - ${c.className} (${c.schedule.frequency})`);
  });
};

// Test for different days
console.log("=== Day-Based Filtering Test ===\n");

simulateDay('Monday');
simulateDay('Tuesday');
simulateDay('Wednesday');
simulateDay('Thursday');
simulateDay('Friday');
simulateDay('Saturday');
simulateDay('Sunday');

console.log("\n=== Summary ===");
console.log("• Monday: Shows weekly classes scheduled for Monday");
console.log("• Tuesday: Shows weekly classes scheduled for Tuesday");
console.log("• Wednesday: Shows weekly classes scheduled for Wednesday");
console.log("• Thursday: Shows weekly classes scheduled for Thursday");
console.log("• Friday: Shows weekly classes scheduled for Friday");
console.log("• Saturday: Shows weekly classes + monthly classes scheduled for Saturday");
console.log("• Sunday: Shows weekly classes scheduled for Sunday");
console.log("• This Week: Shows today's classes + all weekly classes");
console.log("• This Month: Shows all classes with regular schedules (weekly/bi-weekly/monthly)");
console.log("• No Schedule classes are excluded from day-based filters"); 
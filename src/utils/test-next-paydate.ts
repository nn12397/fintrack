import { getNextScheduledPayDate } from './services/paycheck-service';
import { supabase } from './lib/supabase';

async function testNextPayDate() {
  try {
    console.log('Starting test...');
    
    // Set authentication with specific user ID
    console.log('Setting up authentication...');
    await supabase.auth.setSession({
      access_token: 'c52e6f4d-ce79-4b38-b91e-25d73266b751',
      refresh_token: ''
    });
    console.log('Authentication set');
    
    // Get and log the next pay date
    console.log('Fetching next pay date...');
    const nextPayDate = await getNextScheduledPayDate();
    console.log('----------------------------------------');
    console.log('Next scheduled pay date:', nextPayDate);
    console.log('----------------------------------------');
    return nextPayDate;
  } catch (error) {
    console.error('Error during test:', error);
    throw error;
  }
}

// Run the test immediately
testNextPayDate();

// Export the test function so it can be imported and run in Bolt.new
export { testNextPayDate };
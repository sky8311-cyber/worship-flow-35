import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RecurringSchedule {
  id: string;
  template_id: string;
  pattern: string;
  days_of_week: number[] | null;
  day_of_month: number | null;
  nth_weekday: number | null;
  weekday_for_nth: number | null;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  create_days_before: number | null;
  create_at_time: string | null;
  last_generated_date: string | null;
  next_generation_date: string | null;
  occurrence_count: number | null;
  interval_value: number | null;
}

interface Template {
  id: string;
  name: string;
  service_name: string | null;
  service_time: string | null;
  theme: string | null;
  scripture_reference: string | null;
  worship_leader: string | null;
  band_name: string | null;
  target_audience: string | null;
  worship_duration: number | null;
  notes: string | null;
  community_id: string | null;
  created_by: string;
}

interface TemplateComponent {
  id: string;
  template_id: string;
  component_type: string;
  label: string;
  position: number;
  duration_minutes: number | null;
  notes: string | null;
  default_content: string | null;
  default_assigned_to: string | null;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    console.log("Starting recurring schedules processing...");
    
    // Get all active recurring schedules
    const { data: schedules, error: schedulesError } = await supabase
      .from("recurring_schedules")
      .select(`
        *,
        template:worship_set_templates(*)
      `)
      .eq("is_active", true);

    if (schedulesError) {
      console.error("Error fetching schedules:", schedulesError);
      throw schedulesError;
    }

    console.log(`Found ${schedules?.length || 0} active schedules`);

    const now = new Date();
    const results: { scheduleId: string; action: string; serviceDate?: string; error?: string }[] = [];

    for (const schedule of schedules || []) {
      try {
        console.log(`Processing schedule ${schedule.id} for template "${schedule.template?.name}"`);
        
        const template = schedule.template as Template;
        if (!template) {
          console.log(`No template found for schedule ${schedule.id}, skipping`);
          results.push({ scheduleId: schedule.id, action: "skipped", error: "No template found" });
          continue;
        }

        // Calculate the next service date based on pattern
        const nextServiceDate = calculateNextServiceDate(schedule, now);
        
        if (!nextServiceDate) {
          console.log(`Could not calculate next service date for schedule ${schedule.id}`);
          results.push({ scheduleId: schedule.id, action: "skipped", error: "Could not calculate next date" });
          continue;
        }

        console.log(`Next service date: ${nextServiceDate.toISOString()}`);

        // Check if we should create a draft now
        const createDaysBefore = schedule.create_days_before || 7;
        const createDate = new Date(nextServiceDate);
        createDate.setDate(createDate.getDate() - createDaysBefore);
        
        // Set creation time if specified
        if (schedule.create_at_time) {
          const [hours, minutes] = schedule.create_at_time.split(":").map(Number);
          createDate.setHours(hours, minutes, 0, 0);
        } else {
          createDate.setHours(0, 0, 0, 0);
        }

        console.log(`Create date threshold: ${createDate.toISOString()}, Now: ${now.toISOString()}`);

        // Check if it's time to create and we haven't already created for this date
        const serviceDateStr = nextServiceDate.toISOString().split("T")[0];
        const lastGeneratedStr = schedule.last_generated_date;

        if (now >= createDate && lastGeneratedStr !== serviceDateStr) {
          // Check if a draft already exists for this date and template
          const { data: existingSet } = await supabase
            .from("service_sets")
            .select("id")
            .eq("community_id", template.community_id)
            .eq("date", serviceDateStr)
            .eq("service_name", template.service_name || template.name)
            .maybeSingle();

          if (existingSet) {
            console.log(`Draft already exists for ${serviceDateStr}, updating schedule`);
            await supabase
              .from("recurring_schedules")
              .update({
                last_generated_date: serviceDateStr,
                next_generation_date: calculateNextServiceDate(schedule, nextServiceDate)?.toISOString().split("T")[0] || null,
              })
              .eq("id", schedule.id);
            
            results.push({ scheduleId: schedule.id, action: "already_exists", serviceDate: serviceDateStr });
            continue;
          }

          // Create draft from template
          console.log(`Creating draft for ${serviceDateStr}...`);
          
          // Create the service set
          const { data: newSet, error: setError } = await supabase
            .from("service_sets")
            .insert({
              service_name: template.service_name || template.name,
              date: serviceDateStr,
              service_time: template.service_time,
              theme: template.theme,
              scripture_reference: template.scripture_reference,
              worship_leader: template.worship_leader,
              band_name: template.band_name,
              target_audience: template.target_audience,
              worship_duration: template.worship_duration,
              notes: template.notes,
              community_id: template.community_id,
              created_by: template.created_by,
              status: "draft",
            })
            .select()
            .single();

          if (setError) {
            console.error(`Error creating service set:`, setError);
            results.push({ scheduleId: schedule.id, action: "error", error: setError.message });
            continue;
          }

          console.log(`Created service set ${newSet.id}`);

          // Copy template components
          const { data: components, error: compError } = await supabase
            .from("template_components")
            .select("*")
            .eq("template_id", template.id)
            .order("position");

          if (!compError && components && components.length > 0) {
            const setComponents = components.map((comp: TemplateComponent) => ({
              service_set_id: newSet.id,
              component_type: comp.component_type,
              label: comp.label,
              position: comp.position,
              duration_minutes: comp.duration_minutes,
              notes: comp.notes,
              content: comp.default_content,
              assigned_to: comp.default_assigned_to,
            }));

            const { error: insertCompError } = await supabase
              .from("set_components")
              .insert(setComponents);

            if (insertCompError) {
              console.error(`Error copying components:`, insertCompError);
            } else {
              console.log(`Copied ${components.length} components`);
            }
          }

          // Update schedule with last generated date
          const nextNextDate = calculateNextServiceDate(schedule, nextServiceDate);
          await supabase
            .from("recurring_schedules")
            .update({
              last_generated_date: serviceDateStr,
              next_generation_date: nextNextDate?.toISOString().split("T")[0] || null,
            })
            .eq("id", schedule.id);

          results.push({ scheduleId: schedule.id, action: "created", serviceDate: serviceDateStr });
          console.log(`Successfully created draft for ${serviceDateStr}`);
        } else {
          console.log(`Not yet time to create draft (createDate: ${createDate.toISOString()}, lastGenerated: ${lastGeneratedStr})`);
          
          // Update next_generation_date if not set
          if (!schedule.next_generation_date) {
            await supabase
              .from("recurring_schedules")
              .update({ next_generation_date: serviceDateStr })
              .eq("id", schedule.id);
          }
          
          results.push({ scheduleId: schedule.id, action: "not_yet", serviceDate: serviceDateStr });
        }
      } catch (scheduleError) {
        console.error(`Error processing schedule ${schedule.id}:`, scheduleError);
        results.push({ 
          scheduleId: schedule.id, 
          action: "error", 
          error: scheduleError instanceof Error ? scheduleError.message : "Unknown error" 
        });
      }
    }

    console.log("Processing complete. Results:", JSON.stringify(results, null, 2));

    return new Response(
      JSON.stringify({ success: true, processed: results.length, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Fatal error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function calculateNextServiceDate(schedule: RecurringSchedule, fromDate: Date): Date | null {
  const startDate = new Date(schedule.start_date);
  const endDate = schedule.end_date ? new Date(schedule.end_date) : null;
  
  // Start searching from the later of startDate or fromDate
  let searchDate = new Date(Math.max(startDate.getTime(), fromDate.getTime()));
  
  // If fromDate is before startDate, use startDate
  if (fromDate < startDate) {
    searchDate = new Date(startDate);
  }

  const maxIterations = 365; // Prevent infinite loops
  let iterations = 0;

  while (iterations < maxIterations) {
    iterations++;
    
    // Check end date
    if (endDate && searchDate > endDate) {
      return null;
    }

    const dayOfWeek = searchDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const dayOfMonth = searchDate.getDate();
    
    switch (schedule.pattern) {
      case "daily":
        // If we're past fromDate, this is our next date
        if (searchDate > fromDate) {
          return searchDate;
        }
        searchDate.setDate(searchDate.getDate() + 1);
        break;

      case "weekly":
        // Check if this day of week is in the schedule
        if (schedule.days_of_week?.includes(dayOfWeek)) {
          if (searchDate > fromDate) {
            return searchDate;
          }
        }
        searchDate.setDate(searchDate.getDate() + 1);
        break;

      case "biweekly":
        // For biweekly, check if this is a valid week
        if (schedule.days_of_week?.includes(dayOfWeek)) {
          const weeksDiff = Math.floor((searchDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
          if (weeksDiff % 2 === 0 && searchDate > fromDate) {
            return searchDate;
          }
        }
        searchDate.setDate(searchDate.getDate() + 1);
        break;

      case "monthly":
        // Specific day of month
        if (schedule.day_of_month && dayOfMonth === schedule.day_of_month) {
          if (searchDate > fromDate) {
            return searchDate;
          }
        }
        searchDate.setDate(searchDate.getDate() + 1);
        break;

      case "monthly_nth":
        // Nth weekday of month (e.g., 2nd Sunday)
        if (schedule.nth_weekday && schedule.weekday_for_nth !== null) {
          if (dayOfWeek === schedule.weekday_for_nth) {
            const nthOccurrence = Math.ceil(dayOfMonth / 7);
            if (nthOccurrence === schedule.nth_weekday && searchDate > fromDate) {
              return searchDate;
            }
          }
        }
        searchDate.setDate(searchDate.getDate() + 1);
        break;

      default:
        // Unknown pattern, try weekly with Sunday as default
        if (dayOfWeek === 0 && searchDate > fromDate) {
          return searchDate;
        }
        searchDate.setDate(searchDate.getDate() + 1);
        break;
    }
  }

  return null;
}

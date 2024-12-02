import asyncio
import logging
import os
import traceback
import signal
import inspect

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger

from tasks.sync_stocks import sync_stocks_with_user_stocks
from tasks.update_prices import update_stock_data
from tasks.daily import track_portfolio_performance, track_fear_greed_index

# Global variables
scheduler_running = True  # Track scheduler state
scheduler = None  # Store the scheduler instance

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

# Get intervals from environment variables (with defaults)
SYNC_INTERVAL_HOURS = int(os.getenv("SYNC_INTERVAL_HOURS", 1))
UPDATE_PRICES_INTERVAL_HOURS = int(os.getenv("UPDATE_PRICES_INTERVAL_HOURS", 1))
PERFORMANCE_TRACK_INTERVAL_HOURS = int(os.getenv("PERFORMANCE_TRACK_INTERVAL_HOURS", 1))
FEAR_GREED_INTERVAL_HOURS = int(os.getenv("FEAR_GREED_INTERVAL_HOURS", 1))

def safe_task_wrapper(task, task_name):
    """
    Wraps a task (sync or async) in a try-except block to handle errors gracefully.
    """
    async def _run_task():
        if inspect.iscoroutinefunction(task):
            await task()
        else:
            task()

    try:
        asyncio.run(_run_task())
    except Exception as e:
        logging.error(f"[ERROR] Task {task_name} failed: {e}")
        logging.error(traceback.format_exc())

def start_scheduler():
    """
    Starts the background scheduler and schedules all tasks.
    """
    global scheduler
    scheduler = BackgroundScheduler()

    # Schedule tasks
    scheduler.add_job(
        lambda: safe_task_wrapper(sync_stocks_with_user_stocks, "Sync stocks with user_stocks"),
        IntervalTrigger(hours=SYNC_INTERVAL_HOURS),
        name="Sync stocks with user_stocks",
        id="sync_stocks_with_user_stocks",
    )
    logging.info(f"Scheduled: Sync stocks with user_stocks (every {SYNC_INTERVAL_HOURS} hours)")

    scheduler.add_job(
        lambda: safe_task_wrapper(update_stock_data, "Update stock prices"),
        IntervalTrigger(hours=UPDATE_PRICES_INTERVAL_HOURS),
        name="Update stock prices",
        id="update_stock_prices",
    )
    logging.info(f"Scheduled: Update stock prices (every {UPDATE_PRICES_INTERVAL_HOURS} hours)")

    scheduler.add_job(
        lambda: safe_task_wrapper(track_portfolio_performance, "Track portfolio performance"),
        IntervalTrigger(hours=PERFORMANCE_TRACK_INTERVAL_HOURS),
        name="Track portfolio performance",
        id="track_portfolio_performance",
    )
    logging.info(f"Scheduled: Track portfolio performance (every {PERFORMANCE_TRACK_INTERVAL_HOURS} hours)")

    scheduler.add_job(
        lambda: safe_task_wrapper(track_fear_greed_index, "Track Fear & Greed Index"),
        IntervalTrigger(hours=FEAR_GREED_INTERVAL_HOURS),
        name="Track Fear & Greed Index",
        id="track_fear_greed_index",
    )
    logging.info(f"Scheduled: Track Fear & Greed Index (every {FEAR_GREED_INTERVAL_HOURS} hours)")

    scheduler.start()
    logging.info("[INFO] Scheduler started.")

def stop_scheduler():
    global scheduler_running
    global scheduler
    if scheduler_running:
        try:
            scheduler.shutdown()
            logging.info("[INFO] Scheduler stopped.")
            scheduler_running = False
        except Exception as e:
            logging.error(f"[ERROR] Failed to stop scheduler: {e}")

def get_scheduled_jobs():
    """
    Returns the list of currently scheduled jobs.
    """
    if scheduler:
        jobs = scheduler.get_jobs()
        return [{"id": job.id, "name": job.name, "next_run": job.next_run_time} for job in jobs]
    else:
        return []

def shutdown_handler(signum, frame):
    """
    Signal handler for graceful shutdown.
    """
    global scheduler_running
    if scheduler_running:
        logging.info("[INFO] Received shutdown signal. Stopping scheduler...")
        stop_scheduler()

def setup_signal_handlers():
    """
    Sets up signal handlers for graceful shutdown.
    """
    signal.signal(signal.SIGINT, shutdown_handler)
    signal.signal(signal.SIGTERM, shutdown_handler)

def is_scheduler_running():
    """
    Check if the scheduler is running.
    """
    return scheduler and scheduler.running

if __name__ == "__main__":
    start_scheduler()
    setup_signal_handlers()
    # Keep the script running
    try:
        while True:
            pass
    except (KeyboardInterrupt, SystemExit):
        stop_scheduler()

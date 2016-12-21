import os
import pg_raw_sniffer
import pg_raw_server
import logging
import time

executed_query = ""

def dummy_execute_query(query):
	global executed_query
	executed_query = query

class arguments():
    pass

# Function test_sniffer
# Launches the sniffer, creates a file and makes sure it is detected and correctly interpreted
def test_sniffer():	  
    args = arguments()
    args.reload = 'true'
    args.folder = 'data'
    args.snoop_conf_folder = 'snoop_conf_folder'
    # create test folders
    if not os.access(args.snoop_conf_folder, os.F_OK):
        os.mkdir(args.snoop_conf_folder)
    remove_data_folder = False
    if not os.access(args.folder, os.F_OK):
        os.mkdir(args.folder)
        remove_data_folder = True
        
    pg_raw_sniffer.init_sniffer(args,dummy_execute_query)
    
    
    file_path = args.folder+'/test_file.csv'
    with open(file_path, mode='w+') as f:
        f.write('''policyID,statecode,county,eq_site_limit,hu_site_limit,fl_site_limit,fr_site_limit,tiv_2011,tiv_2012,eq_site_deductible,hu_site_deductible,fl_site_deductible,fr_site_deductible,point_latitude,point_longitude,line,construction,point_granularity
119736,FL,CLAY COUNTY,498960,498960,498960,498960,498960,792148.9,0,9979.2,0,0,30.102261,-81.711777,Residential,Masonry,1
448094,FL,CLAY COUNTY,1322376.3,1322376.3,1322376.3,1322376.3,1322376.3,1438163.57,0,0,0,0,30.063936,-81.707664,Residential,Masonry,3
''')

    time.sleep(1.5)
    #logging.info("Executed query: %s" % executed_query)
    
    expected_query = '''DROP TABLE IF EXISTS test_file; CREATE TABLE test_file ( 
	"policyID" int NOT NULL,
	"statecode" text NOT NULL,
	"county" text NOT NULL,
	"eq_site_limit" real NOT NULL,
	"hu_site_limit" real NOT NULL,
	"fl_site_limit" real NOT NULL,
	"fr_site_limit" real NOT NULL,
	"tiv_2011" real NOT NULL,
	"tiv_2012" real NOT NULL,
	"eq_site_deductible" int NOT NULL,
	"hu_site_deductible" real NOT NULL,
	"fl_site_deductible" int NOT NULL,
	"fr_site_deductible" int NOT NULL,
	"point_latitude" real NOT NULL,
	"point_longitude" text NOT NULL,
	"line" text NOT NULL,
	"construction" text NOT NULL,
	"point_granularity" int NOT NULL
)'''
    assert executed_query == expected_query
        

    # deletes test files and folders
    pg_raw_sniffer.clear_snoop_conf_file()
    os.rmdir(args.snoop_conf_folder)
    os.remove(file_path)
    if remove_data_folder:
        os.rmdir(args.folder)

if __name__ == '__main__':
    test_sniffer()

#!/usr/local/bin/perl
use URI::Escape;
use JSON;

# Read in the POST data and URL-decode it.
$data="";
while (<>) {
  $data .= $_;
}
$data = uri_unescape($data);
$data =~ s/.*?=//;  # JSON::decode_json doesn't like the 'payload=' prefix.

# Save for debugging.
open (MYFILE, '>./postdata.txt');
print MYFILE $data;
close (MYFILE);

# Parse the JSON
$perl_scalar = decode_json $data;
$id=$perl_scalar->{'after'};
die unless $id =~ /^[0-9][a-f]*$/;
print "Id: $id\n";

# Run the actual commit hook.
system("./commit.sh $id");

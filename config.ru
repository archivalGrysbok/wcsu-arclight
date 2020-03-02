# This file is used by Rack-based servers to start the application.

#require_relative 'config/environment'

#run Rails.application

require ::File.expand_path('../config/environment',  __FILE__)
map '/arclight' do
  run Rails.application
end

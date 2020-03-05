Change into arclight user, go to arclight home directory.
>   su arclight
>   cd ~

Install Ruby/Rails/Rbenv following this tutorials, using ruby 2.6.5:
  https://www.hugeserver.com/kb/install-ruby-on-rails-centos/
  
>  (a lot of steps from that link above, be sure to use ruby 2.6.5)

Install rails version 5.0
>  gem install rails -v 5.0

>  gem install rails -v 5.2
  
Install arclight from template
>  rails new arclight -m https://raw.githubusercontent.com/projectblacklight/arclight/master/template.rb

you'll get a complaint about a mismatch between rails versions. Go in to ~/arclight/Gemfile
>  nano ~/arclight/Gemfile

Edit the line that begins "gem 'rails'"
It should be 
   gem 'rails', '~> 5.2'

Save using ctrl+O (O for Output)

Update the bundles using the new rails version
>  cd arclight
>  bundle update
>  bundle upate

nano ~/config/application.rb
edit the rails version from 6.0 to 5.2

open ~/arclight/Gemfile and remove 

rerun below, and hit 'n' a lot
>  rails new arclight -m https://raw.githubusercontent.com/projectblacklight/arclight/master/template.rb


comment out locale picker from ~/app/controllers/application_controller.rb


To make the application happily run in a subdirectory (example: http://archives.library.wcsu.edu/arclight/)
	Edit these files:
		./config/initializers/assets.rb , add line 
			Rails.application.config.assets.prefix = "/arclight/asset"
			
		./config/application.rb , add line (in the middle, after the line with the version)
			config.relative_url_root = "/arclight/"

		./config/routes.rb , edit the 'mounts' lines:
			mount Blacklight::Engine => '/a/'
			mount Arclight::Engine => '/a/'
			
		./config.ru , comment everything out with # and add		
			require ::File.expand_path('../config/environment',  __FILE__)
				map '/arclight' do
					run Rails.application
				end


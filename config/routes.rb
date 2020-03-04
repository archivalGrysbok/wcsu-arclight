Rails.application.routes.draw do

scope 'arc' do

concern :range_searchable, BlacklightRangeLimit::Routes::RangeSearchable.new
  mount Blacklight::Engine => '/'
    mount Arclight::Engine => '/'

  root to: "catalog#index"
  concern :searchable, Blacklight::Routes::Searchable.new


  resource :catalog, only: [:index], as: 'catalog', path: 'catalog', controller: 'catalog' do
    concerns :searchable
    concerns :range_searchable

  end

  devise_for :users
  concern :exportable, Blacklight::Routes::Exportable.new

  resources :solr_documents, only: [:show], path: 'catalog', controller: 'catalog' do
    concerns :exportable
  end

  resources :bookmarks do
    concerns :exportable

    collection do
      delete 'clear'
    end

end



#resource :repositories, path: 'arclight/repo'


end

  # For details on the DSL available within this file, see http://guides.rubyonrails.org/routing.html
end
